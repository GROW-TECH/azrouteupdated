// app/dashboard/student/profile/page.jsx   (or wherever your route lives)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient"; // adjust if your client path differs

import { Skeleton } from "../../../components/ui/skeleton";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { ProfileImage } from "../../../components/profile/ProfileImage";
import ProfileEditForm from "../../../components/profile/ProfileEditForm";
import { Card } from "../../../components/ui/card";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null); // normalized frontend shape
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // redirect to login if not signed in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/student/login");
    }
  }, [status, router]);

  // load student_list row by session email
  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        setLoading(true);
        const email = session?.user?.email;
        if (!email) throw new Error("No email in session");

        const { data, error } = await supabase
          .from("student_list")
          .select(
            "id, reg_no, name, dob, email, phone, place, class_type, group_name, course, level, avatar"
          )
          .eq("email", email)
          .single();

        if (error) throw error;

        const normalized = {
          id: data.id,
          reg_no: data.reg_no ?? null,
          Student_name: data.name ?? "",
          dob: data.dob ?? null,
          email: data.email ?? null,
          mobile: data.phone ?? null,
          location: data.place ?? null,
          class_type: data.class_type ?? null,
          group_name: data.group_name ?? null,
          course: data.course ?? null,
          level: data.level ?? null,
          avatar: data.avatar ?? null, // optional column
        };

        setProfile(normalized);
      } catch (err) {
        console.error("Failed to load profile from student_list:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, status]);

  // update handler: expects form data in UI shape (Student_name, email, mobile, location, optional profile.avatar)
  const handleProfileUpdate = async (formData) => {
    if (!profile?.id) {
      throw new Error("No profile row loaded");
    }

    try {
      setLoading(true);

      // map UI keys -> DB columns
      const payload = {};
      if (typeof formData.Student_name !== "undefined") payload.name = formData.Student_name;
      if (typeof formData.email !== "undefined") payload.email = formData.email;
      if (typeof formData.mobile !== "undefined") payload.phone = formData.mobile;
      if (typeof formData.location !== "undefined") payload.place = formData.location;
      if (typeof formData.course !== "undefined") payload.course = formData.course;
      if (typeof formData.level !== "undefined") payload.level = formData.level;

      // support avatar via profile object: { profile: { avatar: url } }
      if (formData?.profile?.avatar) {
        payload.avatar = formData.profile.avatar;
      }
      if (formData.avatar) {
        payload.avatar = formData.avatar;
      }

      if (Object.keys(payload).length === 0) {
        // nothing to update
        return profile;
      }

      const { data, error } = await supabase
        .from("student_list")
        .update(payload)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      // normalize returned row and update local state
      const normalized = {
        id: data.id,
        reg_no: data.reg_no ?? null,
        Student_name: data.name ?? "",
        dob: data.dob ?? null,
        email: data.email ?? null,
        mobile: data.phone ?? null,
        location: data.place ?? null,
        class_type: data.class_type ?? null,
        group_name: data.group_name ?? null,
        course: data.course ?? null,
        level: data.level ?? null,
        avatar: data.avatar ?? null,
      };

      setProfile(normalized);
      return normalized;
    } catch (err) {
      console.error("Failed to update student_list:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  // Build a user object expected by ProfileImage/ProfileEditForm
  const userForUI = {
    id: profile.id,
    Student_name: profile.Student_name,
    email: profile.email,
    mobile: profile.mobile,
    location: profile.location,
    course: profile.course,
    level: profile.level,
    profile: { avatar: profile.avatar }, // ProfileImage expects user.profile?.avatar
    initials:
      (profile.Student_name && profile.Student_name.split(" ").map((s) => s[0]).slice(0, 2).join("")) ||
      (profile.email && profile.email[0]?.toUpperCase()) ||
      "NA",
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-6">
        <ProfileImage user={userForUI} onUpdate={async (p) => await handleProfileUpdate({ profile: p.profile })} />
        <div>
          <h1 className="text-2xl font-bold">{userForUI.Student_name}</h1>
          <p className="text-muted-foreground">{userForUI.email}</p>
          <p className="text-sm">{userForUI.mobile || "No contact number"}</p>
        </div>
      </div>

      {/* Profile Edit Form */}
      <Card className="p-6">
        <ProfileEditForm
          user={{
            Student_name: profile.Student_name,
            email: profile.email,
            mobile: profile.mobile,
            location: profile.location,
          }}
          onSubmit={async (formData) => {
            // ProfileEditForm sends Student_name, email, mobile, location
            // Map and send to DB via handleProfileUpdate
            return handleProfileUpdate(formData);
          }}
        />
      </Card>
    </div>
  );
}
