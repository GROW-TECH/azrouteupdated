// components/profile/ProfileHeader.jsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function ProfileHeader({ user = {}, isEditable = false }) {
  const router = useRouter();
  const avatarSrc = user.avatar || "/mnt/data/099618f0-af8f-4b8e-89b1-01e4c097a651.png";

  return (
    <div className="w-full flex justify-center bg-white py-12">
      <div className="w-full max-w-3xl px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarSrc}
              alt={user.name || "Coach Avatar"}
              className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
            />
            {/* small chess badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#0B1A39] rounded-full p-2 shadow-md">
              {/* Simple chess knight icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 21h18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10c2-3 6-4 9-4 0 0-1 3-1 4 0 2 1 5 1 5H7s0-3 0-5c0-1 .5-2 0-5z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Name */}
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">{user.name || "Coach Name"}</h2>

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-6 text-gray-600">
            {/* email */}
            <div className="flex items-center gap-2 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 8.5l9 6 9-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>{user.email || "no-email@example.com"}</span>
            </div>

            {/* location */}
            <div className="flex items-center gap-2 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="11" r="2" fill="currentColor"/>
              </svg>
              <span>{user.location || "offline"}</span>
            </div>

            {/* specialty */}
            <div className="flex items-center gap-2 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 3h12v6H6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 9l3 11h6l3-11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{user.specialty || "Chess"}</span>
            </div>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="mt-4 text-center text-gray-700 max-w-xl">{user.bio}</p>
          ) : null}

          {/* Stats / actions */}
          <div className="mt-6 w-full flex flex-col sm:flex-row justify-between items-center gap-4">
           

            {isEditable ? (
             <div className="flex justify-end mt-6 w-full">
  <button
    onClick={() => router.push("/dashboard/teacher/profile/edit")}
    className="px-5 py-2 rounded-md bg-[#0B1A39] text-white hover:bg-[#08142b] transition"
  >
    Edit Profile
  </button>
</div>


            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
