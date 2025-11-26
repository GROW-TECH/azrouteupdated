'use client';
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import ProfileTabs from "@/app/components/profile/ProfileTabs";
import axios from "axios";
import { useEffect, useState } from "react";

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    axios.get('/api/teacher/profile')
      .then(res => {
        setTeacher(res.data);
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
      });
  }, []);

  if (!teacher) {
    return <div className="text-center mt-20">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader user={teacher} isEditable={true} />
      
    </div>
  );
}