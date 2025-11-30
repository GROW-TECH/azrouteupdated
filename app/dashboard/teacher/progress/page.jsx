"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [manualProgress, setManualProgress] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [level, setLevel] = useState("");
  const [notes, setNotes] = useState("");
// new states (place with other useState)
const [editingId, setEditingId] = useState(null);
const [editValues, setEditValues] = useState({ progress_percentage: 0, level: "", notes: "" });

// start editing a row
const handleEditClick = (item) => {
  setEditingId(item.id ?? item.student_id);
  setEditValues({
    progress_percentage: item.progress_percentage ?? 0,
    level: item.level ?? "",
    notes: item.notes ?? "",
  });
};

// cancel edit
const handleCancelEdit = () => {
  setEditingId(null);
  setEditValues({ progress_percentage: 0, level: "", notes: "" });
};

// save edit -> call API then refresh manual progress
const handleSaveEdit = async () => {
  if (!editingId) return;
  try {
    const res = await fetch("/api/teacher/updateProgress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        progress_percentage: Number(editValues.progress_percentage),
        level: editValues.level,
        notes: editValues.notes,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      await fetchManualProgress();
      setEditingId(null);
    } else {
      console.error("Update failed:", json);
      alert(json.error || "Failed to update");
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Failed to update");
  }
};

  // fetch main progress & students/courses
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/progress", { credentials: "include" });
      const json = await res.json();
      const raw = Array.isArray(json.students) ? json.students : Array.isArray(json.entries) ? json.entries : [];
      const normalized = raw.map((s) => {
        const totalVideos = Number(s.total_videos ?? s.totalVideos ?? 0);
        const completedVideos = Number(s.completed_videos ?? s.completedVideos ?? 0);
        const watchedSeconds = Number(s.watched_seconds ?? s.watchedSeconds ?? 0);
        const totalSeconds = Number(s.total_seconds ?? s.totalSeconds ?? 0);

        let completion = 0;
        if (totalSeconds > 0) completion = Math.round((watchedSeconds / totalSeconds) * 100);
        else if (totalVideos > 0) completion = Math.round((completedVideos / totalVideos) * 100);
        else completion = Number(s.progress_percent ?? s.completion ?? s.completion_percent ?? 0);

        return {
          student_id: s.id ?? s.student_id,
          reg_no: s.reg_no ?? s.regNo ?? null,
          name: s.name ?? s.student_name ?? "",
          phone: s.phone ?? s.mobile ?? "",
          place: s.place ?? "",
          course_id: s.course_id ?? s.courseId ?? null,
          course_title: s.course ?? s.course_title ?? s.title ?? "",
          level: s.level ?? "",
          total_videos: totalVideos,
          completed_videos: completedVideos,
          watched_seconds: watchedSeconds,
          total_seconds: totalSeconds,
          completion: Math.min(100, Math.max(0, completion)),
        };
      });

      setEntries(normalized);
      setStudents(json.students || []);
      setCourses(json.courses || []);
    } catch (err) {
      console.error("Failed to load progress", err);
      setEntries([]);
      setStudents([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch manual progress (deduping done in backend is preferred)
  const fetchManualProgress = async () => {
    try {
      const res = await fetch("/api/teacher/getManualProgress", { credentials: "include" });
      const json = await res.json();
      if (json && json.manualProgress) {
        setManualProgress(json.manualProgress);
      } else {
        setManualProgress([]);
      }
    } catch (err) {
      console.error("Failed to load manual progress", err);
      setManualProgress([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchData();
      await fetchManualProgress();
    })();
    return () => { mounted = false; };
  }, []);

  const courseOptions = useMemo(() => {
    return (courses || []).map((c) => ({ id: c.id, title: c.title }));
  }, [courses]);

  const studentOptions = useMemo(() => {
    return (students || []).map((s) => ({ id: s.id, name: s.name }));
  }, [students]);

  const handleAddProgress = async () => {
    if (!studentId) {
      alert("Select a student");
      return;
    }
    const newProgress = {
      student_id: studentId,
      progress_percentage: Number(progressPercentage),
      level,
      notes,
    };

    try {
      const res = await fetch("/api/teacher/addProgress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProgress),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Progress added successfully!");
        setIsAddingProgress(false);
        // refresh both tables
        await fetchData();
        await fetchManualProgress();
        // reset inputs
        setStudentId("");
        setProgressPercentage(0);
        setLevel("");
        setNotes("");
      } else {
        console.error("Error response from server:", result);
        alert(result.error || "Failed to add progress");
      }
    } catch (error) {
      console.error("Error adding progress:", error);
      alert("Failed to add progress");
    }
  };

  const filtered = useMemo(() => {
    const qlower = q.trim().toLowerCase();
    return (entries || []).filter((e) => {
      const matchesQ =
        !qlower ||
        (e.name && e.name.toLowerCase().includes(qlower)) ||
        (String(e.reg_no ?? "").toLowerCase().includes(qlower));
      const matchesCourse = courseFilter === "all" || String(e.course_id) === String(courseFilter) || e.course_title === courseFilter;
      return matchesQ && matchesCourse;
    });
  }, [entries, q, courseFilter]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Progress</h1>

      <Button onClick={() => setIsAddingProgress(true)} className="mb-4">Add Progress</Button>

      {isAddingProgress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {(studentOptions || []).map((student) => (
                    <SelectItem key={student.id} value={String(student.id)}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
                placeholder="Progress Percentage"
              />

              <Input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Level"
              />

              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
              />

              <Button onClick={handleAddProgress}>Submit Progress</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Students Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Reg / ID</TableHead>
                  <TableHead>Name</TableHead>
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
                ) : (filtered || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No records found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={`${e.student_id ?? "s"}-${e.course_id ?? "c"}`}>
                      <TableCell className="font-medium">{e.reg_no ?? e.student_id}</TableCell>
                      <TableCell>{e.name}</TableCell>
                      <TableCell>{e.course_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-sm mb-1">{Math.round(e.completion)}%</div>
                            <Progress
                              value={Math.round(e.completion)}
                              className="h-4 rounded-xl shadow-inner bg-gray-200"
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

     {/* Manual Progress */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="text-2xl">Manual Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!manualProgress || manualProgress.length) === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">No manual progress found.</TableCell>
            </TableRow>
          ) : (
            (manualProgress || []).map((item) => {
              const rowKey = item.id ?? item.student_id;
              const isEditing = editingId === rowKey;
              return (
                <TableRow key={rowKey}>
                  <TableCell>{item.student_name ?? item.student_id}</TableCell>

                  {/* Progress */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.progress_percentage}
                        onChange={(e) => setEditValues(prev => ({ ...prev, progress_percentage: e.target.value }))}
                        className="w-24"
                        min={0}
                        max={100}
                      />
                    ) : (
                      `${item.progress_percentage ?? 0}%`
                    )}
                  </TableCell>

                  {/* Level */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.level}
                        onChange={(e) => setEditValues(prev => ({ ...prev, level: e.target.value }))}
                        className="w-32"
                      />
                    ) : (
                      item.level
                    )}
                  </TableCell>

                  {/* Notes */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.notes}
                        onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    ) : (
                      item.notes
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditClick(item)}>Edit</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>

    </div>
  );
}
