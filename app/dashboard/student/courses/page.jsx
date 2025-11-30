"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Eye, Download } from "lucide-react";

export default function StudentCourseListPage() {
  const { data: session, status } = useSession();
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesByCourse, setClassesByCourse] = useState({});
  const [openCourse, setOpenCourse] = useState(null);
  const [courseInfoMap, setCourseInfoMap] = useState({});
  const BUCKET = "course_pdfs";

  // NEW: lock state for current student
  const [studentId, setStudentId] = useState(null);
  const [studentLocked, setStudentLocked] = useState(false);
  const [studentDueRaw, setStudentDueRaw] = useState(null); // effective due (payment-level or student-level raw)
  const [studentDueNote, setStudentDueNote] = useState(null);

  useEffect(() => {
    async function load() {
      if (status === "loading") return;
      setLoading(true);

      // Check if the user is logged in
      if (status !== "authenticated" || !session?.user?.email) {
        console.error("User not authenticated");
        setAssignedCourses([]); // Clear assigned courses if not logged in
        setLoading(false);
        return;
      }

      try {
        const email = session.user.email;
        // fetch student including student-level due fields
        const { data: student, error } = await supabase
          .from("student_list")
          .select("id, course, level, due_date, due_note, status")
          .eq("email", email)
          .single();

        if (error || !student) {
          console.error("Failed to fetch student row:", error);
          setAssignedCourses([]);
          setLoading(false);
          return;
        }

        // save student id for other handlers
        setStudentId(student.id);

        // Compute assignedCourses as before
        const rawCourse = student.course;
        const rawLevel = student.level;

        let coursesArray = [];
        if (!rawCourse) coursesArray = [];
        else if (Array.isArray(rawCourse))
          coursesArray = rawCourse.map((c) => String(c).trim()).filter(Boolean);
        else if (typeof rawCourse === "string") {
          try {
            const parsed = JSON.parse(rawCourse);
            if (Array.isArray(parsed))
              coursesArray = parsed.map((c) => String(c).trim()).filter(Boolean);
            else coursesArray = rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          } catch {
            coursesArray = rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } else {
          coursesArray = [String(rawCourse)];
        }

        let levelsArray = [];
        if (!rawLevel) levelsArray = [];
        else if (Array.isArray(rawLevel))
          levelsArray = rawLevel.map((l) => String(l).trim());
        else if (typeof rawLevel === "string") {
          try {
            const parsedL = JSON.parse(rawLevel);
            if (Array.isArray(parsedL)) levelsArray = parsedL.map((l) => String(l).trim());
            else levelsArray = rawLevel.split(",").map((s) => s.trim());
          } catch {
            levelsArray = rawLevel.split(",").map((s) => s.trim());
          }
        } else {
          levelsArray = [String(rawLevel)];
        }

        const final = coursesArray.map((title, idx) => {
          const level = levelsArray[idx] ?? (levelsArray[0] ?? "");
          return { title, level, studentId: student.id };
        });

        setAssignedCourses(final);

        // ---- NEW: compute lock status ----
        // fetch latest payment (if any)
        const { data: payments } = await supabase
          .from("payments")
          .select("id, status, due_date, note")
          .eq("student_id", student.id)
          .order("date", { ascending: false })
          .limit(1);

        const latest = Array.isArray(payments) && payments.length ? payments[0] : null;
        const paymentDue = latest?.due_date ?? null;
        const studentDue = student.due_date ?? null;
        const effectiveDue = paymentDue || studentDue || null;
        const effectiveNote = latest?.note || student.due_note || null;

        // helper: date-only compare (today > due) => past
        const isDatePast = (d) => {
          if (!d) return false;
          const target = new Date(d);
          if (isNaN(target.getTime())) return false;
          const tOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
          const now = new Date();
          const nOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          return nOnly > tOnly;
        };

        const hasPaid = (latest && String(latest.status || "").toLowerCase() === "paid")
          || (String(student.status || "").toLowerCase() === "paid");

        const locked = !hasPaid && effectiveDue && isDatePast(effectiveDue);

        setStudentLocked(Boolean(locked));
        setStudentDueRaw(effectiveDue);
        setStudentDueNote(effectiveNote);
        // ---- end new ----

      } catch (err) {
        console.error("Unexpected error loading student courses:", err);
        setAssignedCourses([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session, status]);

  // Fetch classes based on course title and level (case-insensitive matching)
  const fetchClassesFor = useCallback(async (courseTitle, level) => {
    setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: true, error: null, items: [] } }));

    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data: classes, error } = await supabase
        .from("classlist")
        .select("id, class_name, level, date, time, meet_link, coach, status")
        .ilike("class_name", courseTitle)
        .ilike("level", level)
        .gte("date", today)
        .order("date", { ascending: true });

      if (error) throw error;

      // filter out same-day classes whose time is already past
      const now = new Date();
      const filtered = (classes || []).filter((cls) => {
        if (!cls.date) return false;
        const datePart = String(cls.date).slice(0, 10);
        const timePart = cls.time ? String(cls.time).trim() : "";

        if (!timePart) {
          return true;
        }

        const [hh, mm] = timePart.split(":").map(Number);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return true;

        const clsDateTime = new Date(datePart);
        clsDateTime.setHours(hh, mm, 0, 0);

        return clsDateTime >= now;
      });

      setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: false, error: null, items: filtered } }));
    } catch (err) {
      console.error("Error fetching classes for", courseTitle, err);
      setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: false, error: err.message || "Failed", items: [] } }));
    }
  }, []);

  const toggleOpenCourse = (course) => {
    if (openCourse === course.title) {
      setOpenCourse(null);
      return;
    }
    setOpenCourse(course.title);
    // fetch classes if not already loaded
    if (!classesByCourse[course.title]) fetchClassesFor(course.title, course.level);
  };

  useEffect(() => {
    if (assignedCourses.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(
          assignedCourses.map(async (c) => {
            const key = `${c.title}__${c.level}`;
            if (courseInfoMap[key]) return;

            const { data, error } = await supabase
              .from("course")
              .select("id, title, level, pdf_path")
              .eq("title", c.title)
              .eq("level", c.level)
              .maybeSingle();

            let row = data;
            if (!row) {
              const { data: fallback } = await supabase
                .from("course")
                .select("id, title, level, pdf_path")
                .eq("title", c.title)
                .limit(1)
                .maybeSingle();
              row = fallback || null;
            }

            if (!cancelled) {
              setCourseInfoMap((prev) => ({ ...prev, [key]: row || null }));
            }
          })
        );
      } catch (err) {
        console.error("Error fetching course info for assigned courses", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assignedCourses]);

  // Get public or signed URL of stored file
  const getFileUrl = useCallback(
    async (storedPath) => {
      if (!storedPath) return null;
      const p = String(storedPath).replace(/^\/+/, "");
      try {
        const { data: publicData, error: publicErr } = await supabase.storage.from(BUCKET).getPublicUrl(p);
        if (!publicErr && publicData && publicData.publicUrl) {
          return publicData.publicUrl;
        }
      } catch (e) {
        console.error("getPublicUrl error", e);
      }

      try {
        const { data: signedData, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(p, 60 * 60);
        if (!signedErr && signedData && signedData.signedUrl) {
          return signedData.signedUrl;
        }
      } catch (e) {
        console.error("createSignedUrl error", e);
      }
      return null;
    },
    [BUCKET]
  );

  const handleOpenPdf = async (pdfPath) => {
    if (studentLocked) {
      alert("Access blocked: your due deadline has passed. Contact admin to lift the block.");
      return;
    }
    const url = await getFileUrl(pdfPath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else alert("File not available");
  };

  const handleDownloadPdf = async (pdfPath, filename = "course.pdf") => {
    if (studentLocked) {
      alert("Access blocked: your due deadline has passed. Contact admin to lift the block.");
      return;
    }
    const url = await getFileUrl(pdfPath);
    if (!url) {
      alert("File not available");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // handleJoinFast: mark attendance & open meet link — BLOCK if locked
  const handleJoinFast = async (cls, studentIdLocal) => {
    if (!cls) return;
    if (studentLocked) {
      alert("Access blocked: your due deadline has passed. Contact admin to lift the block.");
      return;
    }
    if (cls.meet_link) {
      try {
        const attendancePayload = {
          student_id: studentIdLocal,
          attendance_date: new Date().toISOString().slice(0, 10),
          status: "P",
          class_type: "GMeet",
          class_list_id: cls.id,
        };

        const { error } = await supabase
          .from("student_attendance")
          .upsert(attendancePayload);

        if (error) {
          console.error("Error marking attendance:", error);
          alert("There was an issue recording your attendance.");
          return;
        }

        window.open(cls.meet_link, "_blank", "noopener,noreferrer");
        alert("Attendance marked as Present and the class will open in a new tab.");
      } catch (err) {
        console.error("Error in handling attendance:", err);
        alert("Error recording attendance. Please try again.");
      }
    } else {
      alert("No meeting link available for this class.");
    }
  };

  if (status === "loading" || loading) return <p className="text-center mt-10 text-gray-500">Loading courses...</p>;
  if (status !== "authenticated") return <p className="text-center mt-10 text-gray-500">Please sign in to see your courses.</p>;
  if (assignedCourses.length === 0) return <p className="text-center mt-10 text-gray-500">No assigned courses available.</p>;

  // helper to format due date for UI
  const formatDateDDMMYYYY = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <div className="p-4">
      {/* Course Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {assignedCourses.map((c, i) => {
          const classesState = classesByCourse[c.title] || { loading: false, error: null, items: [] };

          const items = (classesState.items || []).map((it) => {
            let dateStr = it.date;
            if (dateStr instanceof Date) {
              dateStr = dateStr.toISOString().slice(0, 10);
            }
            return { ...it, date: String(dateStr) };
          });

          // compute displayed due (use the same student-level effective due we computed)
          const dueToShow = studentDueRaw ? formatDateDDMMYYYY(studentDueRaw) : null;

          return (
            <Card key={`${c.title}-${i}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <p className="text-sm text-gray-500">Assigned by admin</p>
                <CardTitle className="text-lg font-semibold">{c.title}</CardTitle>
                {/* NEW: show blocked banner on card if studentLocked */}
                {studentLocked && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#fff1f2", color: "#b91c1c", borderRadius: 6, fontSize: 13 }}>
                    <strong>Access blocked:</strong> Your due deadline {dueToShow ? `(${dueToShow})` : ""} has passed. Contact admin.
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <p className="text-xs text-gray-500 mb-2">Level: {c.level || "Not specified"}</p>

                {openCourse === c.title && (
                  <div className="mt-3 border rounded-md p-3 bg-gray-50">
                    {classesState.loading && <div className="text-sm text-gray-500">Loading classes…</div>}
                    {classesState.error && <div className="text-sm text-red-500">{classesState.error}</div>}
                    {items.length === 0 && <div className="text-sm text-gray-500">No classes found for this course.</div>}

                    {items.map((cls) => (
                      <div key={cls.id} className="mb-3 p-2 rounded-md hover:bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{cls.class_name}</div>
                            <div className="text-xs text-gray-500">
                              {cls.date} • {cls.time} • {cls.coach} • {cls.status || ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cls.meet_link ? (
                              <Button onClick={() => handleJoinFast(cls, c.studentId)} className="px-3 py-1">
                                Join
                              </Button>
                            ) : (
                              <Button disabled className="px-3 py-1 bg-gray-200 text-gray-600">
                                No Link
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => {
                      const items = classesByCourse[c.title]?.items || [];
                      const upcoming = (items || []).find((cl) => cl.meet_link);
                      if (upcoming) {
                        handleJoinFast(upcoming, c.studentId);
                      } else {
                        toggleOpenCourse(c);
                      }
                    }}
                    className="px-3 py-1 flex-1"
                    disabled={studentLocked} // disable when locked
                  >
                    {studentLocked ? "Access blocked" : "Join Meet"}
                  </Button>

                  <Button onClick={() => toggleOpenCourse(c)} className="px-3 py-1" disabled={studentLocked}>
                    {openCourse === c.title ? "Hide Classes" : "View Classes"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* PDF Section outside the card - only show if any course has a PDF */}
{(() => {
  // Build list of courses that have a PDF (preserves original ordering)
  const pdfEntries = assignedCourses
    .map((c) => {
      const key = `${c.title}__${c.level}`;
      const courseRow = courseInfoMap[key] || null;
      if (courseRow && courseRow.pdf_path) {
        return { title: c.title, pdf_path: courseRow.pdf_path };
      }
      return null;
    })
    .filter(Boolean);

  if (pdfEntries.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Course PDFs</h2>
      {pdfEntries.map((entry, idx) => (
        <div key={`${entry.title}-${idx}`} className="flex items-center mb-4">
          <span className="mr-3">{entry.title} PDF:</span>
          <Button onClick={() => handleOpenPdf(entry.pdf_path)} className="mr-2">
            <Eye /> View
          </Button>
          <Button onClick={() => handleDownloadPdf(entry.pdf_path, `${entry.title}.pdf`)}>
            <Download /> Download
          </Button>
        </div>
      ))}
    </div>
  );
})()}

    </div>
  );
}
