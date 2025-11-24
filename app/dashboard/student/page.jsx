"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Book, Clock, Trophy, Target, ChevronRight, Loader2 } from "lucide-react";

function OverviewCard({ icon: Icon, title, value, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.28 }}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{value ?? 0}</div>
            <p className="text-xs text-muted-foreground">{subtitle ?? ""}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreBadge({ score }) {
  // color by score
  const bg =
    score == null ? "bg-gray-200 text-gray-800" :
    score >= 85 ? "bg-emerald-600 text-white" :
    score >= 60 ? "bg-yellow-500 text-white" :
    "bg-green-500 text-white";

  return (
    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${bg}`}>
      {score == null ? "-" : `${score}`}
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });

      if (!response.ok) {
        setStats(null);
        setLoading(false);
        return;
      }

      const jsonData = await response.json();
      setStats(jsonData);
    } catch (error) {
      console.error("fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container px-4 py-8">
        <h2 className="text-xl font-semibold">Please sign in to see your dashboard</h2>
      </div>
    );
  }

  const totalCourses = stats?.totalCourses ?? 0;
  const attendancePercent = stats?.attendance?.percent ?? 0;
  const videoProgressPercent = stats?.videoProgress?.percent ?? 0;
  const assessments = Array.isArray(stats?.assessments) ? stats.assessments : [];
  const assessmentsCompleted = assessments.length;
  const activeCourses = stats?.activeCourses ?? [];

  return (
    <div className="container px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Track and improve your chess learning journey.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/dashboard/student/courses")}>
            Browse Courses <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OverviewCard icon={Book} title="Courses Enrolled" value={totalCourses} subtitle="Enrolled Courses"/>
        <OverviewCard icon={Clock} title="Attendance Progress" value={`${attendancePercent}%`} subtitle="Based on attendance" />
        <OverviewCard icon={Trophy} title="Assessments Completed" value={assessmentsCompleted} subtitle="Completed attempts" />
        <OverviewCard icon={Target} title="Video Progress" value={`${videoProgressPercent}%`} subtitle="Based on watched videos" />
      </motion.div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Courses</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="puzzles">Chess Puzzles</TabsTrigger>
        </TabsList>

        {/* Active courses: show only course name and level */}
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            <AnimatePresence>
              {activeCourses.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full text-center py-8">
                  No active courses found.
                </motion.div>
              )}

              {activeCourses.map((c, idx) => {
                // c may be { id, title } or { title } or plain string; also may include level
                const title = c?.title ?? (typeof c === "string" ? c : "Untitled");
                const level = c?.level ?? (c?.title && c?.level === undefined ? "" : c?.level) ?? (c?.level === "" ? "" : c?.level);
                return (
                  <motion.div
                    key={c.id ?? title ?? idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{title}</h3>
                              {level ? <p className="text-xs text-muted-foreground mt-1">Level: <span className="font-medium">{level}</span></p> : null}
                            </div>

                            {/* optional small progress indicator */}
                            <div className="text-right">
                             <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/dashboard/student/courses")}>
            Go to Course <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Assessment tab: show as 'Assessment 1', 'Assessment 2' and highlight score */}
        <TabsContent value="assessment">
          <div className="py-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-lg font-semibold">Completed Assessments</h2>
              <p className="text-sm text-muted-foreground">You have completed <strong>{assessmentsCompleted}</strong> assessment(s).</p>

              <div className="mt-4 space-y-3">
                {assessmentsCompleted === 0 && (
                  <div className="text-sm text-muted-foreground">No completed assessments yet.</div>
                )}

                {assessments.map((a, i) => {
                  // a may have assessment_id, score, completed_at
                  const label = `Assessment ${i + 1}`;
                  const score = a?.score ?? null;
                  return (
                    <motion.div key={a.id ?? i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="p-4 border rounded-md flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">Attempted on: {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <ScoreBadge score={score} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="puzzles">
          <div className="text-center py-8">Chess Puzzles coming soon!</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
