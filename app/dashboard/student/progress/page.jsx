"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../../components/ui/card";
import { BookOpen, Clock, Calendar, User, Video } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from "recharts";

export default function StudentProgressPage() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percent: 0 });
  const [perCourse, setPerCourse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [history, setHistory] = useState([]);
  const [classDetails, setClassDetails] = useState({});
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      if (status === "loading") return;
      setLoading(true);
      setDebugInfo("Starting data load...");

      if (!session?.user?.email) {
        setDebugInfo("No user email found");
        setLoading(false);
        return;
      }

      try {
        // Get student info
        const { data: student, error: studentErr } = await supabase
          .from("student_list")
          .select("id, course, level")
          .eq("email", session.user.email)
          .single();

        if (studentErr || !student) {
          console.error("Failed to fetch student:", studentErr);
          setDebugInfo(`Student fetch error: ${studentErr?.message}`);
          setSummary({ total: 0, present: 0, absent: 0, percent: 0 });
          setPerCourse([]);
          setLoading(false);
          return;
        }

        setDebugInfo(`Student found: ${student.id}, courses: ${student.course}`);
        const studentId = student.id;

        // Parse courses and levels
        const coursesArray = Array.isArray(student.course) ? student.course : student.course.split(",").map(s => s.trim());
        const levelsArray = Array.isArray(student.level) ? student.level : student.level.split(",").map(s => s.trim());

        const finalCourses = coursesArray.map((title, idx) => ({
          title: title.trim(),
          level: levelsArray[idx]?.trim() || "Not specified"
        }));

        setDebugInfo(prev => prev + `\nParsed ${finalCourses.length} courses`);

        // Get ALL classes first to see what's available
        const { data: allClasses = [] } = await supabase
          .from("classlist")
          .select("id, class_name, level, date, time, meet_link, coach")
          .order("date", { ascending: true });

        setDebugInfo(prev => prev + `\nTotal classes in system: ${allClasses.length}`);
        
        // Debug: Show all class names and levels
        if (allClasses.length > 0) {
          const classInfo = allClasses.map(cls => `"${cls.class_name}" (${cls.level})`).join(', ');
          setDebugInfo(prev => prev + `\nAll classes: ${classInfo}`);
        }

        // Calculate progress for each course
        const courseStats = [];
        let overallTotal = 0;
        let overallPresent = 0;
        let overallAbsent = 0;

        for (const course of finalCourses) {
          setDebugInfo(prev => prev + `\n\nProcessing course: "${course.title}" (level: "${course.level}")`);
          
          // IMPROVED MATCHING LOGIC:
          // Find classes for this course and level with flexible matching
          const courseClasses = allClasses.filter(cls => {
            const classNameMatch = cls.class_name?.toLowerCase().includes(course.title.toLowerCase()) || 
                                  course.title.toLowerCase().includes(cls.class_name?.toLowerCase() || "");
            
            const levelMatch = cls.level?.toLowerCase() === course.level.toLowerCase() ||
                             cls.level?.toLowerCase().includes(course.level.toLowerCase()) ||
                             course.level.toLowerCase().includes(cls.level?.toLowerCase() || "");

            setDebugInfo(prev => prev + `\nChecking class: "${cls.class_name}" (${cls.level}) -> nameMatch: ${classNameMatch}, levelMatch: ${levelMatch}`);

            return classNameMatch && levelMatch;
          });

          setDebugInfo(prev => prev + `\nFound ${courseClasses.length} classes for "${course.title}"`);

          const classIds = courseClasses.map(c => c.id);
          const total = classIds.length;
          let presentCount = 0;
          let absentCount = 0;

          if (classIds.length > 0) {
            // Get attendance for these classes
            const { data: attendance = [] } = await supabase
              .from("student_attendance")
              .select("id, status, class_list_id")
              .in("class_list_id", classIds)
              .eq("student_id", studentId);

            setDebugInfo(prev => prev + `\nFound ${attendance.length} attendance records`);
            
            presentCount = attendance.filter(a => a.status === "P").length;
            absentCount = attendance.filter(a => a.status === "A").length;
            
            setDebugInfo(prev => prev + `\nAttendance: ${presentCount} present, ${absentCount} absent out of ${total}`);
          }

          const percent = total > 0 ? Number(((presentCount / total) * 100).toFixed(1)) : 0;
          
          courseStats.push({
            title: course.title,
            level: course.level,
            total,
            present: presentCount,
            absent: absentCount,
            percent,
            classes: courseClasses
          });

          overallTotal += total;
          overallPresent += presentCount;
          overallAbsent += absentCount;
        }

        const overallPercent = overallTotal > 0 ? Number(((overallPresent / overallTotal) * 100).toFixed(1)) : 0;

        setDebugInfo(prev => prev + `\n\nFinal stats: ${overallPresent}/${overallTotal} (${overallPercent}%)`);

        // Load attendance history
        const { data: hist = [] } = await supabase
          .from("student_attendance")
          .select("id, status, class_list_id, attendance_date, created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(12);

        setDebugInfo(prev => prev + `\nFound ${hist.length} attendance history records`);

        // Get class details for history
        if (hist.length > 0) {
          const classIds = hist.map(item => item.class_list_id).filter(Boolean);
          const { data: classData = [] } = await supabase
            .from("classlist")
            .select("id, class_name, date, time, coach")
            .in("id", classIds);

          const classDetailsMap = {};
          classData.forEach(classItem => {
            classDetailsMap[classItem.id] = classItem;
          });
          setClassDetails(classDetailsMap);
        }

        if (!mounted) return;

        setPerCourse(courseStats);
        setSummary({ 
          total: overallTotal, 
          present: overallPresent, 
          absent: overallAbsent, 
          percent: overallPercent 
        });
        setHistory(hist || []);
        
        setDebugInfo(prev => prev + `\n\nData loaded successfully`);

      } catch (err) {
        console.error("Unexpected error:", err);
        setDebugInfo(`Error: ${err.message}`);
        setSummary({ total: 0, present: 0, absent: 0, percent: 0 });
        setPerCourse([]);
        setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [session, status]);

  // ALTERNATIVE: Try a completely different approach - get all classes and match by student enrollment
  const tryAlternativeApproach = async () => {
    setLoading(true);
    setDebugInfo("Trying alternative approach...");
    
    try {
      const { data: student } = await supabase
        .from("student_list")
        .select("id, course, level")
        .eq("email", session.user.email)
        .single();

      if (!student) return;

      // Get ALL classes regardless of name matching
      const { data: allClasses = [] } = await supabase
        .from("classlist")
        .select("id, class_name, level, date, time, meet_link, coach")
        .order("date", { ascending: true });

      setDebugInfo(prev => prev + `\nAlternative: Found ${allClasses.length} total classes`);

      // Just use all classes for now to test
      const classIds = allClasses.map(c => c.id);
      let presentCount = 0;
      let absentCount = 0;

      if (classIds.length > 0) {
        const { data: attendance = [] } = await supabase
          .from("student_attendance")
          .select("id, status, class_list_id")
          .in("class_list_id", classIds)
          .eq("student_id", student.id);

        presentCount = attendance.filter(a => a.status === "P").length;
        absentCount = attendance.filter(a => a.status === "A").length;
      }

      const percent = allClasses.length > 0 ? Number(((presentCount / allClasses.length) * 100).toFixed(1)) : 0;

      setPerCourse([{
        title: "All Classes",
        level: "All Levels",
        total: allClasses.length,
        present: presentCount,
        absent: absentCount,
        percent,
        classes: allClasses
      }]);

      setSummary({ 
        total: allClasses.length, 
        present: presentCount, 
        absent: absentCount, 
        percent 
      });

      setDebugInfo(prev => prev + `\nAlternative: ${presentCount}/${allClasses.length} (${percent}%)`);

    } catch (err) {
      setDebugInfo(prev => prev + `\nAlternative error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAndRecord = async (cl) => {
    if (!cl?.meet_link) return;
    
    const { data: student } = await supabase
      .from("student_list")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!student) return;

    const payload = {
      student_id: student.id,
      attendance_date: new Date().toISOString().split("T")[0],
      status: "P",
      class_type: "GMeet",
      class_list_id: cl.id,
    };

    await supabase.from("student_attendance").upsert(payload);
    window.location.reload();
    window.open(cl.meet_link, "_blank", "noopener,noreferrer");
  };

  // Prepare chart data
  const chartData = perCourse
    .filter(course => course.total > 0)
    .map(course => ({
      name: course.title,
      progress: course.percent,
      present: course.present,
      total: course.total
    }));

  const barColor = (val) => (val >= 75 ? "#10B981" : val >= 50 ? "#F59E0B" : "#EF4444");

  const getStatusBadge = (status) => {
    if (status === "P") return <Badge className="bg-green-100 text-green-800">Present</Badge>;
    if (status === "A") return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-6">
        <p className="text-center mt-10 text-gray-500">Loading progress...</p>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-xs">{debugInfo}</pre>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <p className="text-center mt-10 text-gray-500">Please sign in to see your progress.</p>;
  }

  const { total, present, absent, percent } = summary;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Course Progress</h1>
        <p className="text-sm text-muted-foreground">Based on attendance records</p>
      </div>

      {/* Debug info - remove in production */}
      {/* <details className="bg-yellow-50 p-4 rounded">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 text-xs whitespace-pre-wrap">{debugInfo}</pre>
        <div className="mt-2 space-x-2">
          <Button onClick={tryAlternativeApproach} size="sm" variant="outline">
            Try Alternative Approach
          </Button>
        </div>
      </details> */}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab("overview")}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tab === "overview" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("attendance")}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tab === "attendance" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            Attendance History
          </button>
        </nav>
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Progress"]}
                          labelFormatter={(label) => `Course: ${label}`}
                        />
                        <Bar 
                          dataKey="progress" 
                          name="Progress %"
                          barSize={20}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={barColor(entry.progress)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No progress data available</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      The system found your Java course but couldn't match it with any classes.
                    </p>
                    <Button onClick={tryAlternativeApproach} className="mt-4">
                      Try Alternative Matching
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{percent}%</div>
                  <div className="text-xs text-muted-foreground">Present: {present} / {total}</div>
                </div>
                <Progress value={percent} className="mt-4 h-2" />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-700">{present}</div>
                    <div className="text-xs text-green-600">Present</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-red-700">{absent}</div>
                    <div className="text-xs text-red-600">Absent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">Scheduled classes across all courses</p>
              </CardContent>
            </Card>

            {/* Course List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Your Courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perCourse.map((course, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Level: {course.level} • {course.present}/{course.total} classes
                      </div>
                    </div>
                    <Badge variant="outline">{course.percent}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((record) => {
                  const classDetail = classDetails[record.class_list_id];
                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(record.status)}
                        <div>
                          <div className="font-medium">
                            {classDetail?.class_name || `Class #${record.class_list_id}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {classDetail?.coach && `Coach: ${classDetail.coach}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDate(record.attendance_date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {classDetail?.date && formatDate(classDetail.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}