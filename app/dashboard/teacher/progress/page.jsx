"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/app/components/ui/table";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/progress", { credentials: "include" });
        const json = await res.json();

        // API may return students OR entries — handle both
        const raw = Array.isArray(json.students) ? json.students : Array.isArray(json.entries) ? json.entries : [];

        // normalize each record to the UI shape we expect
        const normalized = raw.map((s) => {
          const totalVideos = Number(s.total_videos ?? s.totalVideos ?? 0);
          const completedVideos = Number(s.completed_videos ?? s.completedVideos ?? 0);
          const watchedSeconds = Number(s.watched_seconds ?? s.watchedSeconds ?? s.watched_seconds ?? 0);
          const totalSeconds = Number(s.total_seconds ?? s.totalSeconds ?? 0);

          let completion = 0;
          if (totalSeconds > 0) completion = Math.round((watchedSeconds / totalSeconds) * 100);
          else if (totalVideos > 0) completion = Math.round((completedVideos / totalVideos) * 100);
          else completion = Number(s.progress_percent ?? s.completion ?? s.completion_percent ?? 0);

          return {
            student_id: s.id ?? s.student_id,
            reg_no: s.reg_no ?? s.regNo ?? s.regNo ?? null,
            name: s.name ?? s.student_name ?? "",
            email: s.email ?? "",
            phone: s.phone ?? s.mobile ?? "",
            place: s.place ?? "",
            course_id: s.course_id ?? s.courseId ?? s.course_id ?? null,
            course_title: s.course ?? s.course_title ?? s.title ?? "",
            level: s.level ?? "",
            total_videos: totalVideos,
            completed_videos: completedVideos,
            watched_seconds: watchedSeconds,
            total_seconds: totalSeconds,
            completion: Math.min(100, Math.max(0, completion)),
          };
        });

        if (!mounted) return;
        setEntries(normalized);
      } catch (err) {
        console.error("Failed to load progress", err);
        if (mounted) setEntries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const courseOptions = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const key = e.course_id ?? e.course_title ?? "__unknown__";
      if (!map.has(key)) map.set(key, e.course_title || "Unknown");
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const qlower = q.trim().toLowerCase();
      const matchesQ =
        !qlower ||
        (e.name && e.name.toLowerCase().includes(qlower)) ||
        (e.email && e.email.toLowerCase().includes(qlower)) ||
        (String(e.reg_no ?? "").toLowerCase().includes(qlower));

      const matchesCourse = courseFilter === "all" || String(e.course_id) === String(courseFilter) || e.course_title === courseFilter;

      return matchesQ && matchesCourse;
    });
  }, [entries, q, courseFilter]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Progress</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Students progress</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Shows per-student progress for your courses.</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Input placeholder="Search student or email / reg no" value={q} onChange={(e) => setQ(e.target.value)} className="w-80" />

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Reg / ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="w-[160px]">Progress</TableHead>
                  <TableHead className="w-[120px]">Videos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading…</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No records found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={`${e.student_id}-${e.course_id}`}>
                      <TableCell className="font-medium">{e.reg_no ?? e.student_id}</TableCell>
                      <TableCell>{e.name}</TableCell>
                      <TableCell className="text-gray-600">{e.email}</TableCell>
                      <TableCell>{e.course_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-sm mb-1">{Math.round(e.completion)}%</div>
<Progress
  value={Math.round(e.completion)}
  className="h-4 rounded-xl shadow-inner bg-gray-200"
  indicatorClassName="rounded-xl"
/>
                          </div>
                          <div className="text-xs text-gray-500 w-12 text-right">{Math.round(e.completion)}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{e.completed_videos}/{e.total_videos}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
