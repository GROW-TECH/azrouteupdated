// pages/api/student/stats.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    // Fetch student data
    const { data: student, error: studentErr } = await supabase
      .from("student_list")
      .select("id, course, level")
      .eq("email", email)
      .single();

    if (studentErr || !student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = student.id;
    const coursesArray = (student.course || "").split(",").map(s => s.trim());

    // Fetch attendance stats
    const { data: attendanceData = [] } = await supabase
      .from("student_attendance")
      .select("status")
      .eq("student_id", studentId)
      .eq("status", "P");

    const attendancePercent = (attendanceData.length / coursesArray.length) * 100;

    // Fetch video progress stats
    const { data: videoData = [] } = await supabase
      .from("course_video_progress")
      .select("watched_seconds, duration_seconds")
      .eq("student_id", studentId);

    let totalWatchedSeconds = 0;
    let totalDurationSeconds = 0;

    videoData.forEach((video) => {
      totalWatchedSeconds += video.watched_seconds || 0;
      totalDurationSeconds += video.duration_seconds || 0;
    });

    const videoProgressPercent = totalDurationSeconds
      ? (totalWatchedSeconds / totalDurationSeconds) * 100
      : 0;

    return res.status(200).json({
      totalCourses: coursesArray.length,
      attendance: { percent: attendancePercent },
      videoProgress: { percent: videoProgressPercent },
    });
  } catch (err) {
    console.error("Error fetching stats", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
