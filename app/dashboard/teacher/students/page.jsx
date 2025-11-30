'use client';

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Download, Search } from "lucide-react";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function StudentsPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'paid' | 'unpaid'
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch courses (server provides student_count on course rows)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/teacher/courses", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error("Failed to load courses");
        if (!alive) return;
        setCourses(Array.isArray(json.courses) ? json.courses : []);
      } catch (e) {
        if (!alive) return;
        setCourses([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  // Fetch students for selected course (or all)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingStudents(true);
        const params = new URLSearchParams();
        if (courseFilter && courseFilter !== "all") params.set("course", courseFilter);
        const res = await fetch(`/api/teacher/students?${params.toString()}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load students");
        const json = await res.json();
        if (!alive) return;
        setStudents(Array.isArray(json.students) ? json.students : []);
      } catch (e) {
        if (!alive) return;
        setStudents([]);
      } finally {
        if (alive) setLoadingStudents(false);
      }
    })();
    return () => (alive = false);
  }, [courseFilter]);

  // Normalize status: treat anything not 'paid' as unpaid
  const normalizeStatus = (s) => {
    const st = (s || "").toString().trim().toLowerCase();
    return st === "paid" ? "paid" : "unpaid";
  };

  // Filtered list by search query and status
  const filtered = useMemo(() => {
    return students.filter((s) => {
      // query match: name, email, reg_no/id
      const q = (query || "").trim().toLowerCase();
      const matchesQuery =
        !q ||
        (s.name && s.name.toString().toLowerCase().includes(q)) ||
        (s.email && s.email.toString().toLowerCase().includes(q)) ||
        (String(s.reg_no ?? s.id).toLowerCase().includes(q));
      // status match using normalizeStatus
      const sNorm = normalizeStatus(s.status);
      const matchesStatus = statusFilter === "all" || statusFilter === sNorm;
      return matchesQuery && matchesStatus;
    });
  }, [students, query, statusFilter]);

  // Build course options (unique title with counts)
  const courseOptions = useMemo(() => {
    const seen = new Set();
    const unique = [];
    for (const c of courses) {
      const title = (c.title || c.coach_name || "").toString();
      if (!title) continue;
      if (!seen.has(title)) {
        seen.add(title);
        unique.push({ title, count: Number(c.student_count ?? 0) });
      }
    }
    return unique;
  }, [courses]);

  // Export CSV for currently visible (filtered) students
  const exportCSV = () => {
    const header = ["Reg No / ID", "Name","Course", "Level"];
    const rows = filtered.map((s) => [
      s.reg_no ?? s.id,
      s.name ?? "",
      s.course ?? "",
      s.level ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${courseFilter === "all" ? "all" : courseFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Students</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Enrolled Students for Your Courses
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-start">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.title} value={c.title}>
                    {c.title} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

           

            <Button onClick={exportCSV} variant="outline" className="whitespace-nowrap">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          

          {loadingStudents ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Reg / ID</TableHead>
                    <TableHead>Name</TableHead>
                    
                    <TableHead>Course</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => {
                      const stat = normalizeStatus(s.status); // 'paid' | 'unpaid'
                      return (
                        <TableRow key={s.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{s.reg_no ?? s.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{s.name}</div>
                            </div>
                          </TableCell>
                         
                          <TableCell>{s.course}</TableCell>
                          <TableCell>{s.level}</TableCell>
                          
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mb-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <strong>
                {courseFilter === "all"
                  ? students.length
                  : (courseOptions.find((c) => c.title === courseFilter)?.count ?? filtered.length)}
              </strong>{" "}
              students for <strong>{courseFilter === "all" ? "All Courses" : courseFilter}</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
