'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { supabase } from '../../lib/supabaseClient';

export default function coursePage() {
  const [course, setcourse] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState('add');
  // form now holds coach_name (string) not coach_id
  const [form, setForm] = useState({ id: null, title: '', level: '', pdf_path: '', coach_name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const BUCKET = 'course_pdfs';
  const [coaches, setCoaches] = useState([]); // array of { id, name } but we'll only use name for select

  useEffect(() => {
    fetchCoaches();
    fetchcourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch courses (expect course.coach_name column exists in DB)
  async function fetchcourse() {
    const { data, error } = await supabase
      .from('course')
      .select('id, title, level, pdf_path, coach_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchcourse', error);
      setcourse([]);
      setFiltered([]);
      return;
    }

    const mapped = (data || []).map((c) => ({
      ...c,
      // keep coach_name as-is (might be null)
      coach_name: c.coach_name ?? '',
    }));

    setcourse(mapped);
    setFiltered(mapped);
  }

  async function fetchCoaches() {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('fetchCoaches', error);
      setCoaches([]);
      return;
    }

    const normalized = (data || []).map((c) => ({
      id: Number(c.id),
      name: c.name,
    }));

    setCoaches(normalized);

    // refresh course after coaches loaded (not required but keeps UI consistent)
    fetchcourse();
  }

  function openAdd() {
    setMode('add');
    setForm({ id: null, title: '', level: '', pdf_path: '', coach_name: '' });
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  }

  function openEdit(row) {
    setMode('edit');
    setForm({
      id: row.id,
      title: row.title || '',
      level: row.level || '',
      pdf_path: row.pdf_path || '',
      coach_name: row.coach_name ?? '',
    });
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({ id: null, title: '', level: '', pdf_path: '', coach_name: '' });
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function uploadFile(file) {
    if (!file) return null;
    try {
      setUploading(true);
      const unique = `${Date.now()}_${file.name}`;
      const uploadPath = unique;
      const { data, error } = await supabase.storage.from(BUCKET).upload(uploadPath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.error('supabase.upload error', error);
        throw error;
      }
      return { path: data.path };
    } catch (err) {
      console.error('uploadFile exception', err);
      alert('Upload failed: ' + (err.message || err));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function getFileUrl(storedPath) {
    if (!storedPath) return null;
    try {
      const { data: publicData, error: publicErr } = supabase.storage.from(BUCKET).getPublicUrl(storedPath);
      if (!publicErr && publicData?.publicUrl) {
        try {
          const resp = await fetch(publicData.publicUrl, { method: 'HEAD' });
          if (resp.ok) return publicData.publicUrl;
        } catch (err) {}
      }
      const { data: signedData, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(storedPath, 3600);
      if (!signedErr && signedData?.signedUrl) return signedData.signedUrl;
      return null;
    } catch (err) {
      console.error('getFileUrl error:', err);
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || form.title.trim() === '') {
      alert('Title required');
      return;
    }
    if (!form.coach_name || form.coach_name.trim() === '') {
      alert('Please select a coach for this course.');
      return;
    }

    const file = fileRef.current?.files?.[0];
    let uploadResult = null;
    if (file) {
      uploadResult = await uploadFile(file);
      if (!uploadResult) return;
    }

    // payload now includes coach_name (string) instead of coach_id
    const payload = {
      title: form.title,
      level: form.level || null,
      pdf_path: uploadResult ? uploadResult.path : form.pdf_path || null,
      coach_name: form.coach_name,
      updated_at: new Date().toISOString(),
    };

    if (mode === 'add') {
      const { data, error } = await supabase.from('course').insert([{
        ...payload,
        created_at: new Date().toISOString(),
      }]).select('id, title, level, pdf_path, coach_name, created_at').maybeSingle();

      if (error) {
        alert('Insert failed: ' + (error.message || JSON.stringify(error)));
        console.error('Insert error', error);
      } else {
        const row = {
          ...data,
          coach_name: data.coach_name ?? '',
        };
        setcourse((prev) => [row, ...prev]);
        setFiltered((prev) => [row, ...prev]);
        closeForm();
      }
    } else {
      const { error } = await supabase.from('course').update(payload).eq('id', form.id);
      if (error) {
        alert('Update failed: ' + (error.message || JSON.stringify(error)));
        console.error('Update error', error);
      } else {
        setcourse((prev) =>
          prev.map((c) => (c.id === form.id ? { ...c, ...payload } : c))
        );
        setFiltered((prev) =>
          prev.map((c) => (c.id === form.id ? { ...c, ...payload } : c))
        );
        closeForm();
      }
    }
  }

  async function deleteCourse(id) {
    if (!confirm('Are you sure to delete this course?')) return;
    const { error } = await supabase.from('course').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      setcourse((prev) => prev.filter((c) => c.id !== id));
      setFiltered((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function handleSearchInput(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFiltered(course);
      return;
    }
    const res = course.filter((c) =>
      (c.title || '').toLowerCase().includes(term) ||
      (c.level || '').toLowerCase().includes(term) ||
      (c.coach_name || '').toLowerCase().includes(term)
    );
    setFiltered(res);
  }

  const handleViewPDF = async (pdfPath) => {
    if (!pdfPath) {
      alert('No PDF file available');
      return;
    }
    try {
      const url = await getFileUrl(pdfPath);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        alert('PDF file not available or accessible');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Error opening PDF: ' + error.message);
    }
  };

  return (
    <div className="page-wrap">
      <div className="container mt-4 content-card">
        <div className="d-flex align-items-center mb-3">
          <h2 className="me-auto page-title">course</h2>
        </div>

        <Row className="align-items-center mb-3 gx-3">
          <Col md={7}>
            <InputGroup className="search-input">
              <FormControl
                placeholder="Search by title, level or coach"
                value={searchTerm}
                onChange={handleSearchInput}
                style={{ borderRadius: '6px', height: '42px' }}
              />
              <Button
                className="btn-search"
                onClick={handleSearch}
                style={{ minWidth: '95px', borderRadius: '6px' }}
              >
                Search
              </Button>
            </InputGroup>
          </Col>
          <Col md={5} className="text-end">
            <Button className="btn-add" onClick={openAdd}>
              + Add Course
            </Button>
          </Col>
        </Row>

        {showForm && (
          <div className="modal fade show d-block custom-modal-overlay">
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title">{mode === 'add' ? 'Add Course' : 'Edit Course'}</h5>
                  <button type="button" className="btn-close" onClick={closeForm}></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body custom-modal-body">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Course Name</Form.Label>
                          <Form.Control
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Level</Form.Label>
                          <Form.Select
                            name="level"
                            value={form.level}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label>Coach</Form.Label>
                          {/* select binds to coach_name (string) */}
                          <Form.Select
                            name="coach_name"
                            value={form.coach_name ?? ''}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Coach</option>
                            {coaches.map((c) => (
                              <option key={String(c.id)} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label>Course PDF</Form.Label>
                          <Form.Control
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                          />
                          {form.pdf_path && !fileRef.current?.files?.length && (
                            <div className="mt-2 existing-file">
                              Existing file:{' '}
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleViewPDF(form.pdf_path);
                                }}
                              >
                                View PDF
                              </a>
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="modal-footer custom-modal-footer">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : (mode === 'add' ? 'Save' : 'Update')}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <Table bordered hover responsive className="course-table">
          <thead>
            <tr>
              <th style={{ width: '240px' }}>Course Name</th>
              <th style={{ width: '160px' }}>Level</th>
              <th style={{ width: '180px' }}>Coach</th>
              <th style={{ width: '140px' }}>PDF</th>
              <th style={{ width: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No course found.</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'normal' }}>{c.title}</td>
                  <td style={{ whiteSpace: 'normal' }}>{c.level}</td>
                  {/* show coach_name directly */}
                  <td style={{ whiteSpace: 'normal' }}>{c.coach_name || '—'}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    {c.pdf_path ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewPDF(c.pdf_path);
                        }}
                        className="view-pdf-link"
                      >
                        View PDF
                      </a>
                    ) : (
                      'No PDF'
                    )}
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                      <Button className="btn-edit" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button className="btn-delete" size="sm" onClick={() => deleteCourse(c.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* styles unchanged */}
<style jsx>{`
        .page-wrap {
          min-height: calc(100vh - 20px);
          background: #f3f6f9;
          padding: 12px 18px;
        }
        .content-card {
          background: #fff;
          border-radius: 6px;
          padding: 22px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .page-title {
          margin: 0;
          font-weight: 600;
          color: #1f2d3d;
        }

        /* Search + Add styles to match pasted UI */
        .search-input .form-control {
          border-right: none;
          box-shadow: none;
        }
        .search-input .btn-search {
          background: linear-gradient(90deg,#6f42ff,#8b5cf6);
          border: none;
          color: #fff;
          box-shadow: none;
        }
        .btn-add {
          background: #28a745;
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
        }

        /* table look */
        .course-table thead th {
          background: #fafbfd;
          border-bottom: 1px solid #e6e9ee;
          font-weight: 600;
          color: #4b5563;
        }
        .course-table tbody td {
          background: #fff;
        }

        .view-pdf-link {
          text-decoration: underline;
          cursor: pointer;
          color: #6f42ff;
        }
        .existing-file a {
          color: #6f42ff;
          text-decoration: underline;
        }

        /* action buttons */
        .btn-edit {
          background: #ffb000;
          border: none;
          color: #fff;
        }
        .btn-delete {
          background: #e53e3e;
          border: none;
          color: #fff;
        }

        /* modal tweaks to keep look identical */
        .custom-modal-overlay {
          background: rgba(0, 0, 0, 0.35);
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
          border-radius: 8px;
        }
        .custom-modal-header,
        .custom-modal-footer {
          flex-shrink: 0;
          position: sticky;
          background: #fff;
          z-index: 1;
          padding: 1rem;
        }
        .custom-modal-header {
          top: 0;
          border-bottom: 1px solid #e9ecef;
        }
        .custom-modal-footer {
          bottom: 0;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
        }
        .custom-modal-body {
          overflow-y: auto;
          max-height: 70vh;
          padding: 1rem;
        }
        .modal-title {
          margin: 0;
        }
        table thead th, table tbody td {
          vertical-align: middle;
        }

        /* responsive tiny tweaks */
        @media (max-width: 767px) {
          .search-input { margin-bottom: 12px; }
          .btn-add { width: 100%; }
        }
      `}</style>    </div>
  );
}
