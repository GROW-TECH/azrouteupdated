// pages/courses/[courseId]/videos/index.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient"; // adjust path
import Link from "next/link";

export default function CourseVideosListPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const BUCKET = "course_videos";

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    (async () => {
      try {
        // fetch course meta
        const { data: courseData, error: courseErr } = await supabase
          .from("course")
          .select("id, title, level")
          .eq("id", courseId)
          .maybeSingle();
        if (courseErr) throw courseErr;
        setCourse(courseData || null);

        // fetch published videos for this course
        const { data: vrows, error: vErr } = await supabase
          .from("course_videos")
          .select("id, video_title, video_path, published, created_at")
          .eq("course_id", courseId)
          .eq("published", true)
          .order("created_at", { ascending: true });
        if (vErr) throw vErr;
        setVideos(vrows || []);
      } catch (err) {
        console.error("Failed to load course videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (!courseId) return <div>Loading…</div>;
  if (loading) return <div className="p-4">Loading videos…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{course?.title || "Course"} — Videos</h1>

      {videos.length === 0 ? (
        <div>No videos published for this course yet.</div>
      ) : (
        <div className="space-y-3">
          {videos.map((v, idx) => (
            <div key={v.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {v.video_title || `Video ${idx + 1}`}
                </div>
                <div className="text-sm text-gray-500">{v.video_path}</div>
              </div>

              <div className="flex items-center gap-2">
                {/* Link to video player page */}
                <Link href={`/courses/${courseId}/videos/${v.id}`}>
                  <a className="px-3 py-1 bg-blue-600 text-white rounded">Watch</a>
                </Link>
                {/* Optional: preview open in new tab using signed url */}
                <button
                  className="px-3 py-1 border rounded"
                  onClick={async () => {
                    const p = String(v.video_path).replace(/^\/+/, "");
                    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(p, 60 * 60);
                    const url = data?.signedUrl || data?.signedURL || data?.publicUrl;
                    if (error || !url) {
                      alert("Preview not available");
                      console.error(error);
                      return;
                    }
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
