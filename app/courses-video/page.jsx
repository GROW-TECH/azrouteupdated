"use client";

import { useState, useEffect, useRef } from "react";
import { Table, Button, Form, Row, Col, InputGroup, FormControl, Modal } from "react-bootstrap";
import { supabase } from "../../lib/supabaseClient";

export default function CourseVideoPage() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] = useState({ course_id: null, video_link: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [videoCounts, setVideoCounts] = useState({});
  const fileRef = useRef(null);

  // Manage modal state
  const [manageCourse, setManageCourse] = useState(null); // { id, title }
  const [manageVideos, setManageVideos] = useState([]); // fetched rows for course
  const [manageLoading, setManageLoading] = useState(false);
  const [editing, setEditing] = useState({}); // temporary client edits keyed by video id
  const [previewingId, setPreviewingId] = useState(null);

  const BUCKET = "course_videos";
  const VIDEOS_TABLE = "course_videos";

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase.from("course").select("id, title").order("created_at", { ascending: false });
    if (error) {
      console.error("fetchCourses", error);
      setCourses([]);
    } else {
      setCourses(data || []);
      if (data && data.length) {
        fetchVideoCounts(data.map((c) => c.id));
      }
    }
  }

  async function fetchVideoCounts(courseIds) {
    try {
      const { data: all } = await supabase.from(VIDEOS_TABLE).select("course_id");
      const map = {};
      (all || []).forEach((r) => (map[r.course_id] = (map[r.course_id] || 0) + 1));
      setVideoCounts(map);
    } catch (err) {
      console.error("fetchVideoCounts error", err);
      setVideoCounts({});
    }
  }

  function openAdd() {
    setMode("add");
    setForm({ course_id: null, video_link: "" });
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({ course_id: null, video_link: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function uploadVideo(file) {
    if (!file) return null;
    try {
      setUploading(true);
      const unique = `${Date.now()}_${file.name}`;
      const uploadPath = unique;
      const { data, error } = await supabase.storage.from(BUCKET).upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        console.error("supabase.upload error", error);
        throw error;
      }
      return data.path;
    } catch (err) {
      console.error("uploadVideo exception", err);
      alert("Upload failed: " + (err.message || err));
      return null;
    } finally {
      setUploading(false);
    }
  }

  // Insert rows into course_videos (no onConflict; filtered server-side before insert)
  async function insertVideoRows(courseId, courseTitle, paths, videoLinks) {
    if (!paths || !paths.length) return { success: true };

    const incoming = Array.from(new Set((paths || []).map((p) => String(p).trim()).filter(Boolean)));
    if (!incoming.length) return { success: true };

    // fetch existing paths for that course to avoid duplicates
    const { data: existingRows, error: fetchErr } = await supabase.from(VIDEOS_TABLE).select("video_path");
    if (fetchErr) {
      console.error("Failed to fetch existing video rows:", fetchErr);
      return { success: false, error: fetchErr };
    }
    const existingPaths = new Set((existingRows || []).map((r) => String(r.video_path)));
    const toInsertPaths = incoming.filter((p) => !existingPaths.has(p));
    if (toInsertPaths.length === 0) return { success: true };

    // ensure videoLinks array aligns with toInsertPaths
    const links = Array.isArray(videoLinks) ? videoLinks : [];
    const rows = toInsertPaths.map((p, index) => ({
      course_id: courseId,
      course_title: courseTitle,
      video_path: p,
      video_link: links[index] || null,
      video_title: null,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from(VIDEOS_TABLE).insert(rows, { returning: "minimal" });
    if (error) {
      console.error("insertVideoRows error", error);
      return { success: false, error };
    }
    return { success: true };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.course_id) {
      alert("Course ID required");
      return;
    }

    const files = fileRef.current?.files;
    const uploadResults = [];

    // build videoLinks array:
    // - if user supplied multiple newline-separated links use them
    // - if single link and multiple files, reuse it for each file
    let videoLinks = [];
    if (form.video_link && String(form.video_link).trim()) {
      const parts = String(form.video_link)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      videoLinks = parts;
    }

    if (files && files.length) {
      for (const file of files) {
        const path = await uploadVideo(file);
        if (path) uploadResults.push(path);
      }
    }

    if (!uploadResults.length) {
      alert("No files uploaded.");
      return;
    }

    // align videoLinks length with uploaded files
    if (videoLinks.length === 0) {
      // nothing provided -> all nulls
      videoLinks = new Array(uploadResults.length).fill(null);
    } else if (videoLinks.length === 1 && uploadResults.length > 1) {
      // single link provided -> repeat for all files
      videoLinks = new Array(uploadResults.length).fill(videoLinks[0]);
    } else if (videoLinks.length !== uploadResults.length) {
      // if multiple links provided but count doesn't match uploaded files, pad/truncate to match
      const tmp = [];
      for (let i = 0; i < uploadResults.length; i++) {
        tmp.push(videoLinks[i] || null);
      }
      videoLinks = tmp;
    }

    const { data: courseRow, error: courseError } = await supabase.from("course").select("id, title").eq("id", form.course_id).single();
    if (courseError || !courseRow) {
      alert("Error fetching course info: " + (courseError?.message || "not found"));
      return;
    }

    const res = await insertVideoRows(courseRow.id, courseRow.title, uploadResults, videoLinks);
    if (!res.success) {
      alert("Failed to save video rows: " + (res.error?.message || "unknown"));
      return;
    }

    closeForm();
    await fetchCourses();
  }

  function handleSearchInput(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    const res = courses.filter((course) => course.title.toLowerCase().includes(term));
    setCourses(res);
  }

  // ---------------- Manage Videos modal functionality ----------------

  async function openManageModal(course) {
    setManageCourse(course);
    setManageLoading(true);
    setManageVideos([]);
    setEditing({});
    try {
      const { data, error } = await supabase
        .from(VIDEOS_TABLE)
        .select("id, video_title, video_path, video_link, published, created_at, updated_at")
        .eq("course_id", course.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setManageVideos(data || []);
    } catch (err) {
      console.error("Failed to load videos for manage modal:", err);
      alert("Failed to load videos: " + (err.message || err));
    } finally {
      setManageLoading(false);
    }
  }

  function closeManageModal() {
    setManageCourse(null);
    setManageVideos([]);
    setEditing({});
  }

  // helper: build signed url (tries common return shapes)
  async function getSignedUrl(path) {
    if (!path) return null;
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path.replace(/^\/+/, ""), 60 * 60);
      if (error) {
        console.error("createSignedUrl error", error);
        return null;
      }
      const signed = data?.signedUrl || data?.signedURL || data?.publicUrl || data?.signed_url;
      return signed || null;
    } catch (err) {
      console.error("getSignedUrl exception", err);
      return null;
    }
  }

  // Preview: open signed url in new tab
  async function handlePreview(row) {
    setPreviewingId(row.id);
    const url = await getSignedUrl(row.video_path);
    setPreviewingId(null);
    if (!url) {
      alert("Unable to create preview URL for this file.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Delete a video row (does not delete file; comment shows how to remove file if desired)
  async function handleDelete(row) {
    if (!confirm("Delete this video record? This will NOT delete the storage file unless you also remove it. Continue?")) return;
    try {
      const { error } = await supabase.from(VIDEOS_TABLE).delete().eq("id", row.id);
      if (error) throw error;
      // If you want to remove the storage file too, uncomment:
      // await supabase.storage.from(BUCKET).remove([row.video_path]);
      setManageVideos((m) => m.filter((r) => r.id !== row.id));
      fetchVideoCounts(courses.map((c) => c.id));
    } catch (err) {
      console.error("Failed to delete video row:", err);
      alert("Delete failed: " + (err.message || err));
    }
  }

  // Start editing client-side
  function startEdit(row) {
    setEditing((e) => ({ ...e, [row.id]: { video_title: row.video_title || "", published: !!row.published, video_link: row.video_link || "" } }));
  }

  function handleEditChange(id, field, value) {
    setEditing((e) => ({ ...e, [id]: { ...(e[id] || {}), [field]: value } }));
  }

  // Save edits to server
  async function saveEdit(id) {
    const data = editing[id];
    if (!data) return;
    try {
      const payload = { video_title: data.video_title, published: !!data.published, video_link: data.video_link || null, updated_at: new Date().toISOString() };
      const { error } = await supabase.from(VIDEOS_TABLE).update(payload).eq("id", id);
      if (error) throw error;
      // refresh single row locally
      setManageVideos((m) => m.map((r) => (r.id === id ? { ...r, ...payload } : r)));
      setEditing((e) => {
        const copy = { ...e };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Failed to update video metadata:", err);
      alert("Update failed: " + (err.message || err));
    }
  }

  // Cancel edit
  function cancelEdit(id) {
    setEditing((e) => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
  }

  // Re-fetch manage list
  async function refreshManageList() {
    if (!manageCourse) return;
    setManageLoading(true);
    try {
      const { data, error } = await supabase
        .from(VIDEOS_TABLE)
        .select("id, video_title, video_path, video_link, published, created_at, updated_at")
        .eq("course_id", manageCourse.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setManageVideos(data || []);
    } catch (err) {
      console.error("refreshManageList error", err);
    } finally {
      setManageLoading(false);
    }
  }

  // ---------------- end Manage modal functionality ----------------

  return (
    <div className="container mt-4">
      <h2>Course Videos</h2>

      <Row className="align-items-center mb-3">
        <Col md={7}>
          <InputGroup>
            <FormControl placeholder="Search by course title" value={searchTerm} onChange={handleSearchInput} style={{ borderRadius: "6px" }} />
            <Button variant="primary" onClick={handleSearch} style={{ minWidth: "85px", maxWidth: "100px", borderRadius: "6px" }}>
              Search
            </Button>
          </InputGroup>
        </Col>
        <Col md={5} className="text-end">
          <Button variant="success" onClick={openAdd}>
            + Add Video
          </Button>
        </Col>
      </Row>

      {/* Upload form modal */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{mode === "add" ? "Add Videos" : "Edit Videos"}</h5>
                <button type="button" className="btn-close" onClick={closeForm}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body custom-modal-body">
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label>Select Course</Form.Label>
                        <Form.Select name="course_id" value={form.course_id || ""} onChange={handleChange} required>
                          <option value="">Select Course</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label>Upload Videos</Form.Label>
                        <Form.Control ref={fileRef} type="file" accept="video/*" multiple />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label>Video Link</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="video_link"
                          value={form.video_link}
                          onChange={handleChange}
                          placeholder="Enter a link for videos"
                        />
                        <Form.Text className="text-muted" />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? "Uploading..." : "Save"}
                  </button>
                  <button type="button" onClick={closeForm} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Videos modal */}
      <Modal show={!!manageCourse} onHide={closeManageModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Videos {manageCourse ? `— ${manageCourse.title}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {manageLoading ? (
            <div>Loading videos…</div>
          ) : (
            <>
              {manageVideos.length === 0 ? (
                <div className="text-muted">No videos for this course yet.</div>
              ) : (
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th style={{ width: "44px" }}>S.NO</th>
                      <th style={{ width: "44%" }}>Title / Path</th>
<th style={{ width: "320px" }}>Link</th>
                      <th style={{ width: "90px" }}>Published</th>
                      <th style={{ width: "200px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageVideos.map((row, idx) => {
                      const edit = editing[row.id] || {};
                      return (
                        <tr key={row.id}>
                          <td>{idx + 1}</td>
                          <td>
                            {editing[row.id] ? (
                              <Form.Control value={edit.video_title} onChange={(e) => handleEditChange(row.id, "video_title", e.target.value)} placeholder="Video title (optional)" />
                            ) : (
                              <>
                                <div className="text-muted" style={{ fontSize: "0.85rem" }}>{row.video_path}</div>
                                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{row.video_title || ""}</div>
                              </>
                            )}
                          </td>
                          <td
  style={{
    width: "320px",
    maxWidth: "320px",
    overflowX: "auto",
    whiteSpace: "nowrap",
  }}
  className="link-cell"
>
  {editing[row.id] ? (
    <Form.Control
      value={edit.video_link}
      onChange={(e) => handleEditChange(row.id, "video_link", e.target.value)}
      placeholder="Video link (optional)"
    />
  ) : row.video_link ? (
    <a
      href={row.video_link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "inline-block", paddingRight: 8 }}
    >
      {row.video_link}
    </a>
  ) : (
    <div className="text-muted">—</div>
  )}
</td>

                          <td>
                            {editing[row.id] ? (
                              <Form.Check type="checkbox" checked={!!edit.published} onChange={(e) => handleEditChange(row.id, "published", e.target.checked)} label={edit.published ? "Yes" : "No"} />
                            ) : (
                              <div>{row.published ? "Yes" : "No"}</div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button size="sm" variant="info" onClick={() => handlePreview(row)} disabled={previewingId === row.id}>
                                {previewingId === row.id ? "Opening…" : "Preview"}
                              </Button>

                              {editing[row.id] ? (
                                <>
                                  <Button size="sm" variant="success" onClick={() => saveEdit(row.id)}>Save</Button>
                                  <Button size="sm" variant="secondary" onClick={() => cancelEdit(row.id)}>Cancel</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="warning" onClick={() => startEdit(row)}>Edit</Button>
                                  <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Delete</Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeManageModal}>Close</Button>
          <Button variant="primary" onClick={refreshManageList}>Refresh</Button>
        </Modal.Footer>
      </Modal>

      {/* Main table listing courses */}
      <Table bordered hover responsive style={{ tableLayout: "fixed", fontSize: "0.90rem" }}>
        <thead>
          <tr>
            <th style={{ width: "260px" }}>Course Name</th>
            <th style={{ width: "160px" }}>Videos Count</th>
            <th style={{ width: "140px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">No courses found.</td>
            </tr>
          ) : (
            courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{videoCounts[course.id] ?? "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="warning" size="sm" onClick={() => openAdd()}>Add Videos</Button>
                    <Button variant="primary" size="sm" onClick={() => openManageModal(course)}>Manage</Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <style jsx>{`
        .custom-modal-overlay {
          background: rgba(0, 0, 0, 0.4);
          position: fixed !important;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        .custom-modal-content {
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .custom-modal-header, .custom-modal-footer {
          flex-shrink: 0;
          position: sticky;
          background: #fff;
          z-index: 1;
          padding: 1rem;
        }
        .custom-modal-header { top: 0; border-bottom: 1px solid #e9ecef; }
        .custom-modal-footer { bottom: 0; border-top: 1px solid #e9ecef; display:flex; justify-content:flex-end; gap:0.5rem; padding:0.75rem 1rem; }
        .custom-modal-body { overflow-y:auto; max-height:70vh; padding:1rem; }
        table thead th, table tbody td { vertical-align: middle; }
      `}</style>
    </div>
  );
}
