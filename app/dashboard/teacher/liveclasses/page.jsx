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
import { toast } from "@/app/components/ui/toast";

/**
 * Helper: try parse ISO or combined date+time strings.
 * Returns a Date object if parse succeeded, otherwise null.
 */
function tryParseStart(c) {
  if (!c) return null;
  // prefer API-provided ISO parse
  if (c._parsed_start_at) {
    const d = new Date(c._parsed_start_at);
    if (!isNaN(d.getTime())) return d;
  }

  // try combination: `${date} ${time}`
  const dateStr = (c.date ?? "").toString().trim();
  const timeStr = (c.time ?? "").toString().trim();

  if (!dateStr && !timeStr) return null;
  // e.g. "2025-11-27 08:00" or "2025-11-27 08:00 AM"
  const combo = `${dateStr} ${timeStr}`.trim();
  const p = Date.parse(combo);
  if (!isNaN(p)) return new Date(p);

  // last resort: try parsing only date (start of day)
  const onlyDate = Date.parse(dateStr);
  if (!isNaN(onlyDate)) return new Date(onlyDate);

  return null;
}

export default function LiveClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showPastToggle, setShowPastToggle] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = `/api/teacher/liveclasses${showPastToggle ? "?show_past=1" : ""}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load classes");
        const json = await res.json();
        if (!alive) return;
        // ensure array
        setClasses(Array.isArray(json.classes) ? json.classes : []);
      } catch (e) {
        if (!alive) return;
        setClasses([]);
        console.error(e);
        toast({ title: "Error", description: "Could not load classes." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [showPastToggle]);

  const levels = useMemo(() => {
    const s = new Set(classes.map(c => c.level).filter(Boolean));
    return ["all", ...Array.from(s)];
  }, [classes]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return classes.filter(c => {
      const hay = `${c.title || ""} ${c.description || ""} ${c.course || ""}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchLevel = levelFilter === "all" || (c.level === levelFilter);
      return matchQ && matchLevel;
    });
  }, [classes, query, levelFilter]);

  const exportCSV = () => {
    const header = ["ID","Title","Date","Time","Duration","Level","Course","Participants","Meet Link"];
    const rows = filtered.map(c => [
      c.id, c.title, c.date ?? "", c.time ?? "", c.duration ?? "", c.level ?? "", c.course ?? "", c.participants_count ?? 0, c.meet_link ?? ""
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liveclasses_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const joinClass = (c) => {
    if (!c.meet_link) { toast({ title: "No Meet Link", description: "This class has no meet link." }); return; }
    window.open(c.meet_link, "_blank");
  };

  const now = useMemo(() => new Date(), [/* keep stable per render */]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Live Classes</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Your assigned classes.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-start">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by title or course" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                {levels.map(l => <SelectItem key={l} value={l}>{l === "all" ? "All Levels" : l}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Show past</label>
              <input type="checkbox" checked={showPastToggle} onChange={() => setShowPastToggle(v => !v)} />
            </div>

            <Button onClick={exportCSV} variant="outline" className="whitespace-nowrap">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_,i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date / Time</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">No classes found.</TableCell>
                    </TableRow>
                  ) : filtered.map(c => {
                    const start = tryParseStart(c);
                    const isExpired = start instanceof Date && !isNaN(start.getTime()) && start.getTime() < now.getTime();
                    const joinDisabled = isExpired || !c.meet_link;

                    return (
                      <TableRow key={c.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>{c.date}</div>
                          <div className="text-xs text-gray-500">{c.time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{c.description?.slice(0,120)}</div>
                        </TableCell>
                        <TableCell>{c.time}</TableCell>
                        <TableCell><Badge className="bg-gray-100 text-gray-800">{c.level}</Badge></TableCell>
                        <TableCell>{c.title ?? "-"}</TableCell>
                        <TableCell>{c.participants_count ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => joinClass(c)}
                              disabled={joinDisabled}
                              className={joinDisabled ? "opacity-50 pointer-events-none" : ""}
                            >
                              {isExpired ? "Expired" : "Join"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Showing <strong>{filtered.length}</strong> classes assigned to you.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
