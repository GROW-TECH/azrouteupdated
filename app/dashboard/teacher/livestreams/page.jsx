"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Calendar, Clock, Users, ExternalLink, Info } from "lucide-react";

export default function TeacherDemoClassesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: session, status } = useSession();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function fetchClasses() {
    setLoadingClasses(true);
    try {
      // fetch from server API which returns demo_classes for the logged-in coach
      const res = await fetch("/api/teacher/livestreams", { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to fetch demo classes (${res.status})`);
      }

      const data = await res.json();
      const rows = Array.isArray(data.demo_classes) ? data.demo_classes : [];

      // server should already filter by coach; just set results
      setClasses(rows);
    } catch (err) {
      console.error("fetchClasses error:", err);
      toast({
        title: "Error",
        description: "Unable to load demo classes",
        variant: "destructive",
      });
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }

  if (loadingClasses || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Demo Classes</h1>
          <p className="text-sm text-muted-foreground">
            Showing classes assigned to: <span className="font-medium">{session?.user?.email ?? "—"}</span>
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Info className="mx-auto mb-3 w-8 h-8 text-muted-foreground" />
          <div>No demo classes found for your account.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map((c) => {
            const id = c.id ?? c._id ?? String(c.id);
            return (
              <Card key={String(id)} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{c.title ?? "Untitled"}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{c.time ?? "-"}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{c.coach ?? "-"}</span>
                      </span>
                      {typeof c.registration_count !== "undefined" && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          • {c.registration_count} registered
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div className="mb-1 font-medium">{c.level ?? "-"}</div>
                    <div className="text-muted-foreground text-xs">{c.course ?? "-"}</div>
                  </div>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {c.description || "No description provided."}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{c.duration ?? "-"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{c.course ?? "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-sm">
                      {c.meet_link ? (
                        <a
                          href={c.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Join link
                        </a>
                      ) : (
                        <div className="text-muted-foreground">No meeting link</div>
                      )}
                    </div>

                    <div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/teacher/demo_classes/${id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
