// app/dashboard/teacher/events/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Search, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { Button } from "@/app/components/ui/button";

/**
 * Events list (only published). Colorful header, shows location from student_events.location.
 * - search is debounced
 * - single-open accordion
 * - location priority: ev.location (string) || ev.location.venue || ev.venue || ev.raw.location || '-'
 */

export default function TeacherEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null); // single-open accordion
  const debounceRef = useRef(null);

  // debounced fetch: call fetchEvents with latest query after delay
  const DEBOUNCE_MS = 320;

  useEffect(() => {
    // initial load
    fetchEvents("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // debounce fetch when search changes
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchEvents(search.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchEvents(q = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: q || "",
        status: "published",
        page: 1,
        limit: 200,
      });
      const res = await fetch(`/api/teacher/events?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      const items = data.events ?? data ?? [];

      const normalized = (items || []).map((ev) => {
        // determine a plain string location from multiple possible shapes
        let loc = null;
        try {
          if (typeof ev.location === "string" && ev.location.trim()) loc = ev.location.trim();
          else if (ev.location && typeof ev.location === "object") {
            if (typeof ev.location.venue === "string" && ev.location.venue.trim()) loc = ev.location.venue.trim();
            else if (typeof ev.location.name === "string" && ev.location.name.trim()) loc = ev.location.name.trim();
          }
          if (!loc && typeof ev.venue === "string" && ev.venue.trim()) loc = ev.venue.trim();
          if (!loc && ev.raw && typeof ev.raw.location === "string" && ev.raw.location.trim()) loc = ev.raw.location.trim();
        } catch (e) {
          // ignore and fallback to null
        }
        if (!loc) loc = null;

        return {
          id: String(ev.id ?? ev._id ?? ev.event_id ?? ""),
          title: ev.title ?? ev.name ?? "Untitled event",
          startDate: ev.date ?? ev.startDate ?? ev.start_date ?? null,
          endDate: ev.endDate ?? ev.end_date ?? null,
          location: loc, // string or null
          description: ev.description ?? "",
          type: ev.type ?? ev.category ?? "",
          raw: ev,
        };
      }).filter(e => e.id);

      setEvents(normalized);
    } catch (err) {
      console.error("fetchEvents error:", err);
      toast({ title: "Error", description: "Unable to load events", variant: "destructive" });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "-";
      return dt.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const toggle = (id) => {
    setOpenId(prev => (prev === id ? null : id)); // single-open
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">All Events - Published events</h1>

        {/* <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events (title or description)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div> */}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No published events found.</div>
        ) : (
          <div className="space-y-6">
            {events.map(ev => {
              const dateText = fmtDate(ev.startDate);
              const venue = ev.location ?? "-";

              return (
                <Card key={ev.id} className="overflow-hidden rounded-lg">
                  {/* royal-blue gradient top */}
                  <div
                    style={{
                      background: "linear-gradient(90deg, #0A2A88 0%, #1E3FAE 35%, #3F60E8 100%)",
                    }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white text-lg font-semibold truncate">{ev.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/90">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{dateText}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{venue}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-white/90 text-sm">{ev.type ? ev.type : ""}</div>
                        <Button variant="ghost" onClick={() => toggle(ev.id)} className="text-white/95">
                          {openId === ev.id ? "Hide →" : "View →"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {openId === ev.id ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium mb-1">About</div>
                          <div className="whitespace-pre-line">{ev.description || "No description provided."}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500 mb-1">Date</div>
                            <div className="text-sm">{dateText}</div>
                          </div>

                          <div className="p-4 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500 mb-1">Location</div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{venue}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Click <span className="font-medium">View →</span> to see details</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
