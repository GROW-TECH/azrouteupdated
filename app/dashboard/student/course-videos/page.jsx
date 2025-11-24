"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

/**
 * DashboardStudentCourseVideosPage
 *
 * Tracks per-student per-video progress and persists to Supabase (course_video_progress).
 *
 * Notes:
 * - Uses a progressMapRef to avoid stale closures inside video event handlers.
 * - Keeps a dirty set (dirtyRef) of video ids requiring an upsert.
 * - Periodically flushes (every 10s) and also flushes on pause/unload.
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

  // progressMap state + ref (so events can read latest)
  // shape: { [videoId]: { currentTime, duration, percent, completed, last_watched_at } }
  const [progressMap, setProgressMap] = useState({});
  const progressMapRef = useRef({});
  const setProgressAndRef = (updater) => {
    setProgressMap((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      progressMapRef.current = next;
      return next;
    });
  };

  // dirty set (refs so updates don't rerender)
  const dirtyRef = useRef(new Set());
  // interval ref for local save and flush-to-supabase
  const flushIntervalRef = useRef(null);

  // Which student id to use when saving progress:
  const getStudentIdForProgress = () => student?.id || studentRow?.id || null;
  const getStorageKey = () => `video_progress:${getStudentIdForProgress() || student?.email || "anon"}`;

  // ------- Load course, videos, and server progress -------
  useEffect(() => {
    if (!student) return;
    setLoading(true);

    (async () => {
      try {
        // 1) find registration row from student_list
        let q = supabase.from("student_list").select("id, reg_no, name, email, course, level").limit(1);
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

        // 2) resolve course
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

        // 3) fetch videos
        const { data: vrows, error: vErr } = await supabase
          .from("course_videos")
          .select("id, video_title, video_path, published, created_at, duration_seconds, video_order")
          .eq("course_id", foundCourse.id)
          .eq("published", true)
          .order("video_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (vErr) throw vErr;
        const videosList = vrows || [];
        setVideos(videosList);

        // 4) load server-side progress for this student + these video ids (if studentId available)
        const studentId = getStudentIdForProgress();
        let serverProgress = {};
        if (studentId && videosList.length > 0) {
          const ids = videosList.map((v) => v.id);
          const { data: savedRows, error: spErr } = await supabase
            .from("course_video_progress")
            .select("video_id, watched_seconds, duration_seconds, completed, last_watched_at")
            .in("video_id", ids)
            .eq("student_id", studentId);

          if (spErr) {
            console.warn("fetch course_video_progress failed:", spErr);
          } else if (Array.isArray(savedRows)) {
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

        // 5) load local storage fallback and merge: serverProgress takes precedence
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

        // Merge into progressMap: server -> local -> computed from video.duration_seconds
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

          // clamp percent
          merged[v.id].percent = Math.max(0, Math.min(100, merged[v.id].percent || 0));
        }

        // set to state + ref
        progressMapRef.current = merged;
        setProgressMap(merged);

        // 6) auto-select the first video (or the first incomplete)
        if (videosList.length > 0) {
          const lastPartially = videosList.find((vv) => (merged[vv.id]?.percent || 0) < 100);
          setSelectedVideo(lastPartially || videosList[0]);
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

  // ------- obtain signed url for selectedVideo -------
  useEffect(() => {
    if (!selectedVideo) {
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
  }, [selectedVideo]);

  // ------- track player events, mark dirty -------
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
      // best-effort flush
      flushProgressToSupabase();
    };

    const onEnded = () => {
      // mark as complete and push to DB immediately
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
      // Seek to last saved time if available
      const saved = progressMapRef.current[selectedVideo?.id];
      if (saved && saved.currentTime && !isNaN(saved.currentTime)) {
        try {
          const sec = Math.min(saved.currentTime, videoEl.duration || saved.currentTime);
          videoEl.currentTime = sec;
        } catch (e) {
          // ignore seek errors
        }
      }
    };

    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("pause", onPauseOrUnload);
    videoEl.addEventListener("ended", onEnded);
    videoEl.addEventListener("loadedmetadata", onLoadedMeta);
    window.addEventListener("beforeunload", onPauseOrUnload);

    // periodic flush (local + supabase) every 10s
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

  // ------- persist local storage -------
  const persistProgressToLocal = () => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(progressMapRef.current || {}));
    } catch (e) {
      console.warn("persist to local failed", e);
    }
  };

  // ------- flush changed progress to Supabase -------
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
        // Keep dirty to retry later
        return;
      }

      // Clear those ids from dirty set on success
      for (const id of dirty) dirtyRef.current.delete(id);
    } catch (err) {
      console.error("flushProgressToSupabase failed", err);
      // Keep dirty for retry
    }
  };

  // flush on unmount (best-effort)
  useEffect(() => {
    return () => {
      persistProgressToLocal();
      // best-effort call
      flushProgressToSupabase();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility: compute overall progress (average percent across videos)
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
    setSelectedVideo(v);
    // scroll to top so video is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // UI handlers for Mark as Complete / Reset
  const handleMarkComplete = async () => {
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
    // Optionally, you may also want to delete rows from DB for this student + course videos:
    // We are not deleting DB rows by default to avoid accidental data loss. If you want to delete:
    // await supabase.from('course_video_progress').delete().in('video_id', videos.map(v=>v.id)).eq('student_id', getStudentIdForProgress())
    alert("Progress reset locally. To remove records server-side, run a deletion query in the dashboard.");
  };

  if (!student) return <div className="p-6">Please sign in to view your course videos.</div>;
  if (loading) return <div className="p-6">Loading course videos…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <div className="bg-white border rounded shadow-sm p-4">
            <div className="aspect-video bg-black rounded overflow-hidden">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain bg-black"
                  controlsList="nodownload noremoteplayback"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">Video preview unavailable</div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-lg">
                  {selectedVideo?.video_title || `${courseRow?.title || "Lecture"} Ep-${videos.findIndex(x => x.id === selectedVideo?.id) + 1}`}
                </h2>
                <div className="text-sm text-gray-500">{selectedVideo?.video_path}</div>
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

                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${p}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{p}%</div>
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
            >
              Mark as complete
            </button>

           
          </div>
        </aside>
      </div>
    </div>
  );
}
