"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient"; // adjust path if needed
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

/**
 * ProfileEditForm - full form for student_list table
 *
 * Props:
 *  - onSaved(savedRow) optional callback after successful save
 *  - onCancel() optional
 */
export default function ProfileEditForm({ onSaved, onCancel }) {
  const { data: session, status } = useSession();
  const [loadingRow, setLoadingRow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentRow, setStudentRow] = useState(null);

  const [formData, setFormData] = useState({
    reg_no: "",
    Student_name: "",
    dob: "",
    email: "",
    mobile: "",
    location: "",
    class_type: "",
    group_name: "",
    course: "",
    level: "",
  });

  // load student row by session email
  useEffect(() => {
    async function load() {
      setError("");
      setSuccess("");
      setLoadingRow(true);

      try {
        if (status !== "authenticated") {
          setError("Not signed in");
          setLoadingRow(false);
          return;
        }

        const email = session?.user?.email;
        if (!email) {
          setError("No email in session");
          setLoadingRow(false);
          return;
        }

        const { data, error } = await supabase
          .from("student_list")
          .select(
            "id, reg_no, name, dob, email, phone, place, class_type, group_name, course, level, avatar"
          )
          .eq("email", email)
          .single();

        if (error) throw error;

        setStudentRow(data);

        setFormData({
          reg_no: data.reg_no ?? "",
          Student_name: data.name ?? "",
          dob: data.dob ? String(data.dob).slice(0, 10) : "",
          email: data.email ?? "",
          mobile: data.phone ?? "",
          location: data.place ?? "",
          class_type: data.class_type ?? "",
          group_name: data.group_name ?? "",
          course: data.course ?? "",
          level: data.level ?? "",
        });
      } catch (err) {
        console.error("Failed to load student row:", err);
        setError(err?.message || "Failed to load profile data");
      } finally {
        setLoadingRow(false);
      }
    }

    load();
  }, [session, status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!studentRow) {
      setError("No student record loaded");
      return;
    }

    if (!formData.Student_name || !formData.Student_name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.reg_no && isNaN(Number(formData.reg_no))) {
      setError("Registration number must be numeric");
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSaving(true);

      // map form fields -> DB columns
      const payload = {
        reg_no: formData.reg_no ? Number(formData.reg_no) : undefined,
        name: formData.Student_name,
        dob: formData.dob || null,
        email: formData.email || null,
        phone: formData.mobile || null,
        place: formData.location || null,
        class_type: formData.class_type || null,
        group_name: formData.group_name || null,
        course: formData.course || null,
        level: formData.level || null,
      };

      // remove undefined keys (so we don't overwrite inadvertently)
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const { data, error } = await supabase
        .from("student_list")
        .update(payload)
        .eq("id", studentRow.id)
        .select()
        .single();

      if (error) throw error;

      setStudentRow(data);

      setFormData({
        reg_no: data.reg_no ?? "",
        Student_name: data.name ?? "",
        dob: data.dob ? String(data.dob).slice(0, 10) : "",
        email: data.email ?? "",
        mobile: data.phone ?? "",
        location: data.place ?? "",
        class_type: data.class_type ?? "",
        group_name: data.group_name ?? "",
        course: data.course ?? "",
        level: data.level ?? "",
      });

      setSuccess("Profile updated successfully");
      if (typeof onSaved === "function") onSaved(data);
    } catch (err) {
      console.error("Failed to update student_list:", err);
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
      // auto-hide success after 2.5s
      setTimeout(() => setSuccess(""), 2500);
    }
  };

  if (loadingRow) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Reg. No</label>
              <Input
                name="reg_no"
                value={formData.reg_no}
                onChange={handleChange}
                placeholder="Registration number"
                inputMode="numeric"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <Input
                name="Student_name"
                value={formData.Student_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">DOB</label>
              <Input
                name="dob"
                value={formData.dob || ""}
                onChange={handleChange}
                type="date"
                placeholder="Date of birth"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Phone number"
                inputMode="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Place</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Place / Address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Class Type</label>
              <Input
                name="class_type"
                value={formData.class_type}
                onChange={handleChange}
                placeholder="Class type"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                name="group_name"
                value={formData.group_name}
                onChange={handleChange}
                placeholder="Group name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Course</label>
              <Input
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="Course"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Level</label>
              <Input
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder="Level"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
