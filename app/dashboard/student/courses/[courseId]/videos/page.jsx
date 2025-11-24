"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // adjust path if needed

export default function CourseVideosPage() {
  const params = useParams();
  const router = useRouter();
  const routeCourseId = params?.courseId;
  const BUCKET = "course_videos";

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  // rough UUID-like check
  const looksLikeId = (v) => {
    if (!v) return false;
    return /^[0-9a-fA-F-]{8,}$/.test(String(v));
  };

  useEffect(() => {
    if (!routeCourseId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let courseRow = null;

        if (looksLikeId(routeCourseId)) {
          // treat param as ID
          const { data: cdata, error: cerr } = await supabase
            .from("course")
            .select("id, title, level, pdf_path")
            .eq("id", routeCourseId)
            .maybeSingle();
          if (cerr) throw cerr;
          courseRow = cdata || null;
          console.log("[videos] looked up course by id:", courseRow);
        } else {
          // treat param as title (fallback)
          const { data: cdata, error: cerr } = await supabase
            .from("course")
            .select("id, title, level, pdf_path")
            .ilike("title", decodeURIComponent(routeCourseId))
            .limit(1)
            .maybeSingle();
          if (cerr) throw cerr;
          courseRow = cdata || null;
          console.log("[videos] looked up course by title:", courseRow);
        }

        if (!courseRow) {
          setError("Course not found.");
          setVideos([]);
          setCourse(null);
          setLoading(false);
          return;
        }

        setCourse(courseRow);

        // fetch published videos for this course
        const { data: vdata, error: verr } = await supabase
          .from("course_videos")
          .select("id, video_title, video_path, published, created_at")
          .eq("course_id", courseRow.id)
          .eq("published", true)
          .order("created_at", { ascending: true });

        if (verr) throw verr;

        const rows = vdata || [];
        if (!rows.length) {
          console.warn("[videos] no rows in course_videos for course_id:", courseRow.id);
        }

        // try to build signed urls for quick preview links (non-blocking)
        const withUrls = await Promise.all(
          rows.map(async (r) => {
            const path = String(r.video_path).replace(/^\/+/, "");
            try {
              const { data: sd, error: se } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
              const url = sd?.signedUrl || sd?.signedURL || sd?.publicUrl || null;
              if (se) console.warn("signedUrl error", se);
              return { ...r, signedUrl: url };
            } catch (e) {
              console.error("signed url exception", e);
              return { ...r, signedUrl: null };
            }
          })
        );

        setVideos(withUrls);
      } catch (err) {
        console.error("[videos] load error", err);
        setError(err.message || "Failed to load videos");
      } finally {
        setLoading(false);
      }
    })();
  }, [routeCourseId]);

  if (loading) return <div className="p-6">Loading videos…</div>;
  if (error) return (
    <div className="p-6">
      <p className="text-red-600 mb-2">Error: {error}</p>
      <Link href="/dashboard/student/courses"><a className="text-blue-600">Back to courses</a></Link>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{course?.title || "Course"} — Videos</h1>
        {course?.level && <div className="text-sm text-gray-500">Level: {course.level}</div>}
      </div>

      {videos.length === 0 ? (
        <div className="text-gray-600">No published videos found for this course.</div>
      ) : (
        <div className="space-y-3">
          {videos.map((v, i) => (
            <div key={v.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{v.video_title || `Video ${i + 1}`}</div>
                <div className="text-sm text-gray-500">{v.video_path}</div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/student/courses/${routeCourseId}/videos/${v.id}`}>
                  <a className="px-3 py-1 bg-blue-600 text-white rounded">Open Player</a>
                </Link>

                {v.signedUrl ? (
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => window.open(v.signedUrl, "_blank", "noopener,noreferrer")}
                  >
                    Preview
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Preview unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
