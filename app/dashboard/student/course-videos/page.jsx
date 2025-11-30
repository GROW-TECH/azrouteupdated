"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

/**
 * DashboardStudentCourseVideosPage (with neat video link UI)
 */

export default function DashboardStudentCourseVideosPage() {
  const { student } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentRow, setStudentRow] = useState(null);
  const [courseRow, setCourseRow] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);

  const BUCKET = "course_videos";

  // progress state + ref
  const [progressMap, setProgressMap] = useState({});
  const progressMapRef = useRef({});
  const setProgressAndRef = (updater) => {
    setProgressMap((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      progressMapRef.current = next;
      return next;
    });
  };

  const dirtyRef = useRef(new Set());
  const flushIntervalRef = useRef(null);

  const getStudentIdForProgress = () => student?.id || studentRow?.id || null;
  const getStorageKey = () => `video_progress:${getStudentIdForProgress() || student?.email || "anon"}`;

  // lock state
  const [studentLocked, setStudentLocked] = useState(false);
  const [studentDueRaw, setStudentDueRaw] = useState(null);
  const [studentDueNote, setStudentDueNote] = useState(null);

  useEffect(() => {
    if (!student) return;
    setLoading(true);

    (async () => {
      try {
        // find registration
        let q = supabase.from("student_list").select("id, reg_no, name, email, course, level, due_date, due_note, status").limit(1);
        if (student.email) q = q.eq("email", student.email);
        else if (student.reg_no) q = q.eq("reg_no", student.reg_no);
        else if (student.Student_name) q = q.ilike("name", `%${student.Student_name}%`);

        const { data: sdata, error: sErr } = await q.maybeSingle();
        if (sErr) throw sErr;
        if (!sdata) {
          setStudentRow(null);
          setCourseRow(null);
          setVideos([]);
          setError("No registration record found for this account.");
          setLoading(false);
          return;
        }
        setStudentRow(sdata);

        // lock logic
        const { data: payments } = await supabase
          .from("payments")
          .select("id, status, due_date, note, date")
          .eq("student_id", sdata.id)
          .order("date", { ascending: false })
          .limit(1);

        const latestPayment = Array.isArray(payments) && payments.length ? payments[0] : null;
        const paymentDue = latestPayment?.due_date ?? null;
        const studentDue = sdata.due_date ?? null;
        const effectiveDue = paymentDue || studentDue || null;
        const effectiveNote = latestPayment?.note || sdata.due_note || null;

        const isDatePast = (d) => {
          if (!d) return false;
          const target = new Date(d);
          if (isNaN(target.getTime())) return false;
          const tOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
          const now = new Date();
          const nOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          return nOnly > tOnly;
        };

        const hasPaid = (latestPayment && String(latestPayment.status || "").toLowerCase() === "paid")
          || (String(sdata.status || "").toLowerCase() === "paid");

        const locked = !hasPaid && effectiveDue && isDatePast(effectiveDue);

        setStudentLocked(Boolean(locked));
        setStudentDueRaw(effectiveDue);
        setStudentDueNote(effectiveNote);

        // resolve course
        const courseValue = sdata.course;
        if (!courseValue) {
          setCourseRow(null);
          setVideos([]);
          setError("No course set on the registration row.");
          setLoading(false);
          return;
        }

        let foundCourse = null;
        let { data: cById } = await supabase.from("course").select("id, title, level").eq("id", courseValue).maybeSingle();
        if (cById) foundCourse = cById;
        if (!foundCourse) {
          let { data: cByTitle } = await supabase.from("course").select("id, title, level").ilike("title", courseValue).limit(1).maybeSingle();
          if (cByTitle) foundCourse = cByTitle;
        }
        if (!foundCourse) {
          let { data: cFuzzy } = await supabase.from("course").select("id, title, level").ilike("title", `%${courseValue}%`).limit(1);
          if (Array.isArray(cFuzzy) && cFuzzy.length > 0) foundCourse = cFuzzy[0];
        }
        if (!foundCourse) {
          setCourseRow(null);
          setVideos([]);
          setError(`Could not resolve registered course ("${courseValue}") to an available course.`);
          setLoading(false);
          return;
        }
        setCourseRow(foundCourse);

        // fetch videos (include video_link)
        const { data: vrows, error: vErr } = await supabase
          .from("course_videos")
          .select("id, video_title, video_path, published, created_at, duration_seconds,video_order,video_link")
          .eq("course_id", foundCourse.id)
          .eq("published", true)
          .order("video_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (vErr) throw vErr;
        const videosList = vrows || [];
        setVideos(videosList);

        // load server progress
        const studentIdForProgress = getStudentIdForProgress();
        let serverProgress = {};
        if (studentIdForProgress && videosList.length > 0) {
          const ids = videosList.map((v) => v.id);
          const { data: savedRows, error: spErr } = await supabase
            .from("course_video_progress")
            .select("video_id, watched_seconds, duration_seconds, completed, last_watched_at")
            .in("video_id", ids)
            .eq("student_id", studentIdForProgress);

          if (!spErr && Array.isArray(savedRows)) {
            for (const r of savedRows) {
              const percent = r.duration_seconds ? Math.round((Number(r.watched_seconds || 0) / Number(r.duration_seconds || 1)) * 100) : 0;
              serverProgress[r.video_id] = {
                currentTime: Number(r.watched_seconds || 0),
                duration: r.duration_seconds ? Number(r.duration_seconds) : null,
                percent: Math.min(100, Math.max(0, percent || 0)),
                completed: !!r.completed,
                last_watched_at: r.last_watched_at,
              };
            }
          }
        }

        // local storage fallback and merge
        const storageKey = getStorageKey();
        const localStorageRaw = localStorage.getItem(storageKey);
        let localProgress = {};
        if (localStorageRaw) {
          try {
            localProgress = JSON.parse(localStorageRaw) || {};
          } catch (e) {
            console.warn("failed to parse local storage progress", e);
          }
        }

        const merged = {};
        for (let i = 0; i < videosList.length; i++) {
          const v = videosList[i];
          const svr = serverProgress[v.id];
          const loc = localProgress[v.id];
          if (svr) {
            merged[v.id] = {
              currentTime: svr.currentTime || (loc?.currentTime ?? 0),
              duration: svr.duration ?? (v.duration_seconds ? Number(v.duration_seconds) : (loc?.duration ?? null)),
              percent: svr.percent ?? (loc?.percent ?? (v.duration_seconds ? Math.round((Number(loc?.currentTime || 0) / Number(v.duration_seconds)) * 100) : 0)),
              completed: svr.completed ?? false,
              last_watched_at: svr.last_watched_at ?? null,
            };
          } else if (loc) {
            merged[v.id] = {
              currentTime: loc.currentTime || 0,
              duration: loc.duration ?? (v.duration_seconds ? Number(v.duration_seconds) : null),
              percent: loc.percent ?? (v.duration_seconds ? Math.round((Number(loc.currentTime || 0) / Number(v.duration_seconds || 1)) * 100) : 0),
              completed: !!loc.completed,
              last_watched_at: loc.last_watched_at ?? null,
            };
          } else {
            merged[v.id] = {
              currentTime: 0,
              duration: v.duration_seconds ? Number(v.duration_seconds) : null,
              percent: 0,
            };
          }
          merged[v.id].percent = Math.max(0, Math.min(100, merged[v.id].percent || 0));
        }

        progressMapRef.current = merged;
        setProgressMap(merged);

        // auto-select first incomplete if not locked
        if (videosList.length > 0) {
          const lastPartially = videosList.find((vv) => (merged[vv.id]?.percent || 0) < 100);
          setSelectedVideo(studentLocked ? null : (lastPartially || videosList[0]));
        }

      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
        setVideos([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  // get signed url for selectedVideo
  useEffect(() => {
    if (!selectedVideo) {
      setVideoUrl(null);
      return;
    }
    if (studentLocked) {
      setVideoUrl(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const path = String(selectedVideo.video_path || "").replace(/^\/+/, "");
        const { data, error: urlErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (!mounted) return;
        if (urlErr) {
          console.warn("createSignedUrl failed:", urlErr);
          setVideoUrl(null);
          return;
        }
        setVideoUrl(data?.signedUrl || data?.publicUrl || null);
      } catch (e) {
        console.error(e);
        if (mounted) setVideoUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [selectedVideo, studentLocked]);

  // player event tracking (unchanged)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !selectedVideo) return;

    const onTimeUpdate = () => {
      const dur = isFinite(videoEl.duration) ? videoEl.duration : 0;
      const ct = videoEl.currentTime || 0;
      const percent = dur > 0 ? Math.min(100, Math.round((ct / dur) * 100)) : 0;

      setProgressAndRef((prev) => {
        const next = {
          ...prev,
          [selectedVideo.id]: {
            ...(prev[selectedVideo.id] || {}),
            currentTime: ct,
            duration: dur || (prev[selectedVideo.id]?.duration ?? null),
            percent,
            completed: prev[selectedVideo.id]?.completed || (dur ? ct >= (dur * 0.95) : false),
          },
        };
        dirtyRef.current.add(selectedVideo.id);
        return next;
      });
    };

    const onPauseOrUnload = () => {
      if (selectedVideo) dirtyRef.current.add(selectedVideo.id);
      persistProgressToLocal();
      flushProgressToSupabase();
    };

    const onEnded = () => {
      setProgressAndRef((prev) => {
        const dur = progressMapRef.current[selectedVideo.id]?.duration ?? videoEl.duration ?? null;
        const next = {
          ...prev,
          [selectedVideo.id]: {
            ...(prev[selectedVideo.id] || {}),
            currentTime: dur ?? videoEl.currentTime ?? 0,
            duration: dur,
            percent: 100,
            completed: true,
            last_watched_at: new Date().toISOString(),
          },
        };
        dirtyRef.current.add(selectedVideo.id);
        return next;
      });
      persistProgressToLocal();
      flushProgressToSupabase();
    };

    const onLoadedMeta = () => {
      const saved = progressMapRef.current[selectedVideo?.id];
      if (saved && saved.currentTime && !isNaN(saved.currentTime)) {
        try {
          const sec = Math.min(saved.currentTime, videoEl.duration || saved.currentTime);
          videoEl.currentTime = sec;
        } catch (e) {}
      }
    };

    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("pause", onPauseOrUnload);
    videoEl.addEventListener("ended", onEnded);
    videoEl.addEventListener("loadedmetadata", onLoadedMeta);
    window.addEventListener("beforeunload", onPauseOrUnload);

    if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    flushIntervalRef.current = setInterval(() => {
      persistProgressToLocal();
      flushProgressToSupabase();
    }, 10000);

    return () => {
      videoEl.removeEventListener("timeupdate", onTimeUpdate);
      videoEl.removeEventListener("pause", onPauseOrUnload);
      videoEl.removeEventListener("ended", onEnded);
      videoEl.removeEventListener("loadedmetadata", onLoadedMeta);
      window.removeEventListener("beforeunload", onPauseOrUnload);
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo, videoUrl]);

  const persistProgressToLocal = () => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(progressMapRef.current || {}));
    } catch (e) {
      console.warn("persist to local failed", e);
    }
  };

  const flushProgressToSupabase = async () => {
    const studentId = getStudentIdForProgress();
    if (!studentId) return;

    const dirty = Array.from(dirtyRef.current || []);
    if (dirty.length === 0) return;

    const rows = [];
    for (const vid of dirty) {
      const p = progressMapRef.current[vid];
      if (!p) continue;
      const watched_seconds = Math.round(p.currentTime || 0);
      const duration_seconds = p.duration ? Math.round(p.duration) : null;
      const completed = Boolean(p.completed) || (duration_seconds ? watched_seconds >= Math.round(duration_seconds * 0.95) : false);
      rows.push({
        student_id: studentId,
        video_id: vid,
        watched_seconds,
        duration_seconds,
        completed,
        last_watched_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) {
      dirtyRef.current.clear();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("course_video_progress")
        .upsert(rows, { onConflict: ["student_id", "video_id"] });

      if (error) {
        console.warn("progress upsert error", error);
        return;
      }

      for (const id of dirty) dirtyRef.current.delete(id);
    } catch (err) {
      console.error("flushProgressToSupabase failed", err);
    }
  };

  useEffect(() => {
    return () => {
      persistProgressToLocal();
      flushProgressToSupabase();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallProgress = () => {
    if (!videos || videos.length === 0) return 0;
    const total = videos.length;
    const sum = videos.reduce((acc, v) => {
      const p = progressMap[v.id]?.percent || 0;
      return acc + p;
    }, 0);
    return Math.round(sum / total);
  };

  const handleSelectVideo = (v) => {
    if (studentLocked) {
      const due = studentDueRaw ? (() => {
        const dt = new Date(studentDueRaw);
        if (isNaN(dt.getTime())) return String(studentDueRaw);
        const dd = String(dt.getDate()).padStart(2, "0");
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const yyyy = dt.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      })() : "—";
      alert(`Access blocked: your due deadline ${due} has passed. Contact admin to lift the block.`);
      return;
    }
    setSelectedVideo(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkComplete = async () => {
    if (studentLocked) {
      alert("Access blocked: cannot mark as complete while overdue. Contact admin.");
      return;
    }
    const vid = videoRef.current;
    if (!selectedVideo) return;
    try {
      const dur = (progressMapRef.current[selectedVideo.id]?.duration) ?? (vid?.duration ?? null);
      const watched_seconds = dur ? Math.round(dur) : Math.round((vid?.currentTime) || 0);
      setProgressAndRef((prev) => {
        const next = {
          ...prev,
          [selectedVideo.id]: {
            ...(prev[selectedVideo.id] || {}),
            currentTime: watched_seconds,
            duration: dur,
            percent: 100,
            completed: true,
            last_watched_at: new Date().toISOString(),
          },
        };
        dirtyRef.current.add(selectedVideo.id);
        return next;
      });
      persistProgressToLocal();
      await flushProgressToSupabase();
    } catch (e) {
      console.warn("Mark complete failed", e);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm("Reset progress for this course?")) return;
    const key = getStorageKey();
    localStorage.removeItem(key);
    setProgressAndRef({});
    dirtyRef.current.clear();
    alert("Progress reset locally. To remove records server-side, run a deletion query in the dashboard.");
  };

  if (!student) return <div className="p-6">Please sign in to view your course videos.</div>;
  if (loading) return <div className="p-6">Loading course videos…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // format helper
  const formatDateDDMMYYYY = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // ---------- Link helpers ----------
  const extractYouTubeId = (url) => {
    if (!url) return null;
    // cover common youtube forms
    const regex = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_\-]{6,})/i;
    const m = String(url).match(regex);
    return m ? m[1] : null;
  };
  const getDomain = (url) => {
    try {
      const u = new URL(url);
      return u.hostname.replace("www.", "");
    } catch (e) {
      return null;
    }
  };
  const copyToClipboard = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      alert("Link copied to clipboard");
    } catch (e) {
      console.warn("copy failed", e);
      alert("Copy failed — select and copy manually");
    }
  };
  // -----------------------------------

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {courseRow ? `${courseRow.title} — Videos` : "Course Videos"}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">Overall progress</div>
          <div className="w-40">
            <div className="h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${overallProgress()}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">{overallProgress()}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div className="bg-white border rounded shadow-sm p-4">
            <div className="aspect-video bg-black rounded overflow-hidden relative">
              {studentLocked && (
                <div className="absolute z-20 left-4 top-4 right-4 p-3 bg-red-50 text-red-700 rounded">
                  <strong>Access blocked:</strong>{" "}
                  {studentDueRaw ? `Due ${formatDateDDMMYYYY(studentDueRaw)} — ${studentDueNote || ""}` : "Your access is blocked."}
                  <div className="text-sm mt-1">Contact admin.</div>
                </div>
              )}

              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain bg-black"
                  controlsList="nodownload noremoteplayback"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  {studentLocked ? "Video access blocked — due passed" : "Video preview unavailable"}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-lg">
                  {selectedVideo?.video_title || `${courseRow?.title || "Lecture"} Ep-${videos.findIndex(x => x.id === selectedVideo?.id) + 1}`}
                </h2>
                <div className="text-sm text-gray-500 truncate">{selectedVideo?.video_path}</div>

                {/* NEW: show link preview / thumbnail */}
                {selectedVideo?.video_link ? (
                  <div className="mt-3 flex items-center gap-3">
                    {extractYouTubeId(selectedVideo.video_link) ? (
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(selectedVideo.video_link)}/hqdefault.jpg`}
                        alt="thumbnail"
                        className="w-28 h-16 rounded object-cover border"
                      />
                    ) : (
                      <div className="w-28 h-16 rounded bg-gray-50 border flex items-center justify-center text-xs text-gray-500">
                        {getDomain(selectedVideo.video_link) || "Link"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <a
                        href={selectedVideo.video_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-medium text-sm truncate text-blue-600 hover:underline"
                        title={selectedVideo.video_link}
                      >
                        {selectedVideo.video_link}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">Click to open — or use the copy button.</div>
                    </div>

                    <div>
                      <button
                        className="px-2 py-1 bg-gray-100 border rounded text-sm"
                        onClick={() => copyToClipboard(selectedVideo.video_link)}
                        title="Copy link"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="text-sm text-gray-600 text-right">
                <div>{selectedVideo?.duration_seconds ? `${Math.round(selectedVideo.duration_seconds)}s` : ""}</div>
                <div className="mt-1">Video {videos.findIndex((x) => x.id === selectedVideo?.id) + 1}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-sm text-gray-600">{(progressMap[selectedVideo?.id]?.percent || 0)}%</div>
              </div>

              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progressMap[selectedVideo?.id]?.percent || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border rounded shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Lectures</div>
              <div className="text-sm text-gray-500">{videos.length} videos</div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
              {videos.map((v, idx) => {
                const p = progressMap[v.id]?.percent || 0;
                const titleFallback = v.video_title || `${courseRow?.title || "Lecture"} Ep-${idx + 1}`;
                const isSelected = selectedVideo?.id === v.id;
                const ytId = extractYouTubeId(v.video_link);
                const domain = v.video_link ? getDomain(v.video_link) : null;

                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer border ${isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
                    onClick={() => handleSelectVideo(v)}
                  >
                    <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                      {titleFallback.split(" ").slice(0, 2).join(" ")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{titleFallback}</div>
                      <div className="text-xs text-gray-400 truncate">{v.video_path}</div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="h-2 bg-gray-200 rounded overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${p}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{p}%</div>
                        </div>

                        {/* Link badge and actions */}
                        {v.video_link ? (
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href={v.video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-50"
                              title={v.video_link}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ytId ? "YouTube" : (domain || "Link")}
                            </a>

                            <button
                              className="text-xs px-2 py-1 border rounded bg-gray-50"
                              onClick={(ev) => { ev.stopPropagation(); copyToClipboard(v.video_link); }}
                              title="Copy link"
                            >
                              Copy
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">{v.duration_seconds ? `${Math.round(v.duration_seconds)}s` : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-4">
            <button
              className="w-full px-3 py-2 bg-blue-600 text-white rounded mb-2"
              onClick={handleMarkComplete}
              disabled={studentLocked}
              title={studentLocked ? "Access blocked — cannot mark complete" : ""}
            >
              Mark as complete
            </button>
            <button
              className="w-full px-3 py-2 border rounded text-sm"
              onClick={handleResetProgress}
            >
              Reset progress
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
