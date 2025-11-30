"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Calendar, Video, Users } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DemoClassListPage() {
  const [demoClasses, setDemoClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const { data: session, status } = useSession(); // get status

  useEffect(() => {
    // only fetch after session is authenticated (ensures cookie/token present)
    if (status === "loading") return;
    setLoading(true);

    // fetch without depending on client-side coachName; server verifies via cookie/token
    fetch(`/api/teacher/demo-classes`, { credentials: "include" }) // ensure cookies are sent
      .then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch (err) {
          console.error("invalid JSON response:", text);
          return null;
        }
      })
      .then((data) => {
        console.log("demo-classes response:", data);
        setDemoClasses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load demo classes", err);
        setDemoClasses([]);
      })
      .finally(() => setLoading(false));
  }, [status]); // run when auth status changes

  async function handleJoin(demo) {
    if (joining) return;
    setJoining(demo.id);

    const payload = {
      user_id: session?.user?.id ?? null,
      user_email: session?.user?.email ?? null,
      user_name: session?.user?.name ?? null,
    };

    try {
      const res = await fetch(`/api/teacher/demo-classes/${demo.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && (json.success || json.message === "already_registered")) {
        setDemoClasses((prev) =>
          prev.map((d) =>
            d.id === demo.id
              ? { ...d, registrations_count: Math.max(0, (d.registrations_count || 0) + (json.message === "already_registered" ? 0 : 1)) }
              : d
          )
        );
      } else {
        console.warn("join response:", json);
      }
    } catch (err) {
      console.error("join failed", err);
    } finally {
      setJoining(null);
      if (demo.meet_link) window.open(demo.meet_link, "_blank");
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Demo Classes</h1>
          <p className="text-muted-foreground">Manage and start your demo classes</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {demoClasses.map((demo) => (
          <Card key={demo.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{demo.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{demo.time}</span>
                <span>•</span>
                <span>{demo.duration}</span>
              </div>

              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                <Users className="h-4 w-4" />
                <span>{demo.registrations_count ?? 0} participants</span>
              </div>

              <div className="flex space-x-3 pt-3">
                <Button className="flex items-center space-x-2" onClick={() => handleJoin(demo)} disabled={joining === demo.id}>
                  <Video className="h-4 w-4" />
                  <span>{joining === demo.id ? "Joining..." : "Join Class"}</span>
                </Button>

              </div>
            </CardContent>
          </Card>
        ))}

        {demoClasses.length === 0 && (
          <p className="text-center text-muted-foreground col-span-2">No demo classes found. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
