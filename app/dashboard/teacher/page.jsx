"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2, Book } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export default function TeacherDashboard() {
  const router = useRouter();

  const [coach, setCoach] = useState({ name: null, specialty: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [recentDemoClasses, setRecentDemoClasses] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) fetch demo classes first (explicit endpoint)
        let demos = [];
        try {
          const demoResp = await fetch("/api/teacher/demo-classes", { credentials: "include" });
          console.log("demo / status", demoResp.status);
          if (demoResp.ok) {
            const demoJson = await demoResp.json();
            demos = (demoJson || []).map((d) => ({
              ...d,
              // normalize fields dashboard expects
              participants_count: d.registrations_count ?? d.participants_count ?? 0,
            }));
            setRecentDemoClasses(demos);
          } else {
            // if not ok, still set empty and log body for debug
            const text = await demoResp.text().catch(() => "");
            console.warn("/api/demo-classes returned", demoResp.status, text);
            setRecentDemoClasses([]);
          }
        } catch (e) {
          console.error("fetch /api/demo-classes failed:", e);
          setRecentDemoClasses([]);
        }

        // 2) fetch profile (optional)
        try {
          const profileResp = await fetch("/api/teacher/profile", { credentials: "include" });
          if (profileResp.ok) {
            const pjson = await profileResp.json();
            setCoach({
              name: pjson.name ?? null,
              specialty: pjson.specialty ?? null,
            });
          }
        } catch (e) {
          console.warn("profile fetch failed:", e);
        }

        // 3) fetch courses
        try {
          const coursesResp = await fetch("/api/teacher/courses", { credentials: "include" });
          if (!coursesResp.ok) throw new Error("Failed to load courses");
          const coursesJson = await coursesResp.json();
          const fetchedCourses = coursesJson.courses || [];
          setCourses(fetchedCourses);

          // derive coach name if missing
          if ((!coach.name || coach.name === null) && fetchedCourses.length > 0) {
            const derived = fetchedCourses[0].coach_name || null;
            if (derived) setCoach((c) => ({ ...c, name: derived }));
          }
        } catch (e) {
          console.error("courses fetch failed:", e);
          // keep going
        }

        // 4) fetch live classes
        let live = [];
        try {
          const liveResp = await fetch("/api/teacher/liveclasses", { credentials: "include" });
          if (!liveResp.ok) {
            console.warn("liveclasses fetch returned non-ok", liveResp.status);
          } else {
            const liveJson = await liveResp.json();
            live = liveJson.classes || [];
          }
        } catch (e) {
          console.error("liveclasses fetch failed:", e);
        }

        // 5) merge demo classes into live classes (avoid duplicate ids)
        if (demos.length > 0) {
          const ids = new Set(live.map((c) => String(c.id)));
          const merged = [...live];
          for (const d of demos) {
            if (!ids.has(String(d.id))) merged.push(d);
          }
          setLiveClasses(merged);
        } else {
          setLiveClasses(live);
        }

        // 6) fetch students count
        try {
          const studentsResp = await fetch("/api/teacher/students", { credentials: "include" });
          if (!studentsResp.ok) throw new Error("Failed to load students");
          const studentsJson = await studentsResp.json();
          setStudentsTotal(Number(studentsJson.total ?? (studentsJson.students?.length ?? 0)));
        } catch (e) {
          console.error("students fetch failed:", e);
        }

      } catch (err) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => router.refresh()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">  Welcome back, {coach.name ?? "Coach"} !!
        </h2>
          <p className="text-muted-foreground">
Time to shape champions.          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Book className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/dashboard/teacher/liveclasses")}>
              View Live Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/teacher/courses")}>
              View Courses
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {courses.slice(0, 3).map((c) => (
                <div key={c.id} className="truncate">{c.title}</div>
              ))}
              {courses.length > 3 ? <div className="text-xs">and {courses.length - 3} more...</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveClasses.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Next: {liveClasses[0] ? `${liveClasses[0].title} • ${liveClasses[0].date ?? ""}` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentDemoClasses.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {recentDemoClasses[0] ? recentDemoClasses[0].title : "No demo classes found"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsTotal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned courses list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No courses assigned.</p>
          ) : (
            <ul className="divide-y">
              {courses.map((c) => (
                <li key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                    <p className="text-xs text-muted-foreground">Students: {c.student_count ?? 0}</p>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/teacher/courses`)}>Open</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Demo classes (Recent Classes) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Demo Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDemoClasses.length > 0 ? (
            <ul className="divide-y">
              {recentDemoClasses.map((c) => (
                <li key={c.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.date ? new Date(c.date).toLocaleDateString() : "—"} • {c.time ?? "—"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(c.meet_link || "#", "_blank")}>Join</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No demo classes found.</p>
          )}
        </CardContent>
      </Card>

      {/* Live classes card (list) */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {liveClasses.length > 0 ? (
            <ul className="divide-y">
              {liveClasses.map((c) => (
                <li key={c.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.date ? new Date(c.date).toLocaleDateString() : "—"} • {c.time ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Participants: {c.participants_count ?? 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(c.meet_link || "#", "_blank")}>Join</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No upcoming live classes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
