"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const didFetch = useRef(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    location: "",
    avatar: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    axios
      .get("/api/teacher/profile", { withCredentials: true })
      .then((res) => {
        const data = res.data || {};
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialty: data.specialty || "",
          location: data.location || "",
          avatar: data.avatar || null
        }));

        setAvatarPreview(data.avatar || null);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          router.push("/login");
          return;
        }
        toast({ title: "Error", description: "Failed to load profile." });
      })
      .finally(() => setLoading(false));
  }, [router, toast]);

  const onAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required." });
      return false;
    }
    if (!form.email.trim()) {
      toast({ title: "Validation", description: "Email is required." });
      return false;
    }
    return true;
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);

    const res = await axios.post("/api/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    return res.data?.url ?? null;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let avatarUrl = form.avatar;

      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile);
      }

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        specialty: form.specialty,
        location: form.location,
        avatar: avatarUrl
      };

      await axios.put("/api/teacher/profile", payload, { withCredentials: true });

      toast({ title: "Saved", description: "Profile updated." });
      router.push("/dashboard/teacher/profile");
    } catch (err) {
      toast({ title: "Error", description: "Could not save profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-20">Loading profile…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div>
              <Label>Avatar</Label>
              <div className="mt-2">
                <Avatar className="h-20 w-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : (
                    <AvatarFallback>{(form.name || "U").slice(0, 2)}</AvatarFallback>
                  )}
                </Avatar>
              </div>
            </div>

            <div className="flex-1">
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />

              <div className="flex gap-2 mt-4">
                <Button onClick={() => avatarRef.current?.click()} disabled={saving}>
                  Change Avatar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setForm((s) => ({ ...s, avatar: null }));
                  }}
                  disabled={saving}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <Label>Specialty</Label>
            <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>

          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

         
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard/teacher/profile")} disabled={saving}>
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
