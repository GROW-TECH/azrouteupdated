"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";
import { Download, MoreHorizontal } from "lucide-react";

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");
  const [openAttempts, setOpenAttempts] = useState({}); // { [assessmentId]: true }
// add under existing useState lines
const [courseQuery, setCourseQuery] = useState("");
const courseOptions = useMemo(() => {
  const set = new Set();
  (assessments || []).forEach(a => {
    if (a.course && String(a.course).trim() !== "") set.add(String(a.course).trim());
  });
  return ["all", ...Array.from(set)];
}, [assessments]);

const filteredCourseOptions = useMemo(() => {
  if (!courseQuery) return courseOptions;
  return courseOptions.filter(c => c === "all" || c.toLowerCase().includes(courseQuery.toLowerCase()));
}, [courseOptions, courseQuery]);

  // --- dynamic status list from DB ---
  const statusOptions = useMemo(() => {
    const set = new Set();
    (assessments || []).forEach(a => {
      if (a.status && String(a.status).trim() !== "") set.add(String(a.status));
    });
    return ["all", ...Array.from(set)];
  }, [assessments]);

  const badgeVariantForStatus = {
    published: "default",
    scheduled: "secondary",
    completed: "default",
    draft: "outline",
    in_progress: "outline",
    // add any other DB statuses here
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [resA, resAtt] = await Promise.all([
          fetch("/api/teacher/assessments", { credentials: "include" }),
          fetch("/api/teacher/assessment_attempts", { credentials: "include" }),
        ]);
        if (!resA.ok || !resAtt.ok) throw new Error("fetch-failed");
        const dataA = await resA.json();
        const dataAtt = await resAtt.json();
        if (!active) return;
        setAssessments(dataA.assessments || []);
        setAttempts(dataAtt.attempts || []);
      } catch {
        setAssessments([]);
        setAttempts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const qMatch =
        !q ||
        (a.title && a.title.toLowerCase().includes(q.toLowerCase())) ||
        String(a.id).toLowerCase().includes(q.toLowerCase());
      const cMatch = course === "all" || a.course === course;
      const sMatch = status === "all" || String(a.status) === String(status);
      return qMatch && cMatch && sMatch;
    });
  }, [assessments, q, course, status]);

  const attemptsByAssessment = useMemo(() => {
    const map = {};
    for (const att of attempts || []) {
      const key = String(att.assessment_id);
      if (!map[key]) map[key] = [];
      map[key].push(att);
    }
    return map;
  }, [attempts]);

  const exportCSV = () => {
    const header = ["ID", "Course", "Date", "Total", "Status"];
    const rows = filtered.map(a => [a.id ?? "-", a.course ?? "-", a.date ?? "-", a.total_marks ?? a.total ?? "-", a.status ?? "-"]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = "assessments.csv"; el.click();
    URL.revokeObjectURL(url);
  };

  const toggleAttempts = (id) => setOpenAttempts(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Assessments</CardTitle>
            <p className="text-sm text-gray-500 mt-1">View assessments and which students completed them.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
            <Input
              placeholder="Search by title or ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:w-72"
            />

            {/* searchable course select */}
<Select value={course} onValueChange={setCourse}>
  <SelectTrigger className="sm:w-44"><SelectValue placeholder="Course" /></SelectTrigger>
  <SelectContent className="w-44">
    {/* small search box inside dropdown */}
    <div className="p-2">
      <Input
        value={courseQuery}
        onChange={(e) => setCourseQuery(e.target.value)}
        placeholder="Search courses..."
        className="w-full"
      />
    </div>

    {/* options */}
    {filteredCourseOptions.map(opt => (
      <SelectItem key={opt} value={opt}>
        {opt === "all" ? "All Courses" : opt}
      </SelectItem>
    ))}
  </SelectContent>
</Select>


           
            <Button variant="outline" onClick={exportCSV} className="flex items-center">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border overflow-x-auto">
           <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[64px]">S.No</TableHead>
      <TableHead>Course</TableHead>
      <TableHead>Date</TableHead>
      <TableHead>Total</TableHead>
      <TableHead>Level</TableHead> {/* colored text from DB */}
      <TableHead className="w-28">Attempts</TableHead>
      <TableHead className="text-right w-12">Actions</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filtered.length === 0 ? (
      <TableRow>
        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
          No assessments found.
        </TableCell>
      </TableRow>
    ) : (
      filtered.map((a, idx) => {
        const idKey = String(a.id);
        const sno = idx + 1;
        const rows = attemptsByAssessment[idKey] || [];
        const avgScore = rows.length
          ? Math.round((rows.reduce((s, r) => s + (Number(r.score) || 0), 0) / rows.length) * 100) / 100
          : null;

        // choose DB text field to display in color. Change 'label' to the actual field name if needed.
        const displayText = (a.label || a.status || a.level || "").toString();
        const textKey = displayText.toLowerCase();

        const colorForText = {
          published: "bg-green-100 text-green-800",
          scheduled: "bg-blue-100 text-blue-800",
          completed: "bg-green-100 text-green-800",
          draft: "bg-yellow-100 text-yellow-800",
          in_progress: "bg-yellow-100 text-yellow-800",
          cancelled: "bg-red-100 text-red-800",
          beginner: "bg-indigo-50 text-indigo-800",
          intermediate: "bg-indigo-50 text-indigo-800",
          advanced: "bg-indigo-50 text-indigo-800",
        };

        const pillClass = colorForText[textKey] ?? "bg-gray-100 text-gray-800";

        return (
          <React.Fragment key={idKey}>
            <TableRow className="hover:bg-gray-50">
              <TableCell className="font-medium">{sno}</TableCell>

              <TableCell>{a.course ?? "-"}</TableCell>

              <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : "-"}</TableCell>

              <TableCell>{a.total_marks ?? a.total ?? "-"}</TableCell>

              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded text-sm ${pillClass}`}>
                  {displayText || "-"}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{rows.length}</Badge>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleAttempts(idKey)}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>

            {openAttempts[idKey] && (
              <TableRow>
                <TableCell colSpan={7} className="bg-gray-50">
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-medium">Attempts for {a.course ?? `#${a.id}`}</div>
                      <div className="text-sm text-gray-600">{rows.length} attempt(s)</div>
                    </div>

                    {rows.length === 0 ? (
                      <div className="text-sm text-gray-500">No attempts yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="py-2">Student Id</th>
                              <th className="py-2">Score</th>
                              <th className="py-2">Completed At</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.id} className="border-b">
                                <td className="py-2">{r.student_id ?? (r.student_email ? r.student_email.split("@")[0] : "—")}</td>
                                <td className="py-2">{r.score ?? "-"} / {a.total_marks ?? a.total ?? "-"}</td>
                                <td className="py-2">{r.completed_at ? new Date(r.completed_at).toLocaleString() : "-"}</td>
                                <td className="py-2">{r.status ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
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
