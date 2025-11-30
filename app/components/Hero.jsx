"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  MessageSquarePlus,
  GraduationCap,
  Users,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleInputChange = (e) => setSearchTerm(e.target.value);

  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      router.push(`/courses?topic=${encodeURIComponent(searchTerm)}`);
    }
  };

  const popularTopics = [
    "Opening Strategies",
    "Middle Game Tactics",
    "Endgame Mastery",
    "Checkmate Patterns",
    "Chess for Beginners",
    "Advanced Positioning",
    "Blitz Techniques",
    "Tournament Preparation",
  ];

  const features = [
    {
      icon: GraduationCap,
      title: "Certified Chess Programs",
      description:
        "Receive official certification upon course completion at Azroute.",
    },
    {
      icon: Users,
      title: "Learn from Masters",
      description: "Train under titled players and experienced chess coaches.",
    },
    {
      icon: Globe,
      title: "Train Anytime, Anywhere",
      description:
        "Join interactive lessons online with flexible schedules.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#60A5FA] text-white">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-2/3 h-2/3 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 py-20 mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-8"
        >
          <div className="px-6 py-2 text-base font-medium bg-[#E0F2FE] border border-[#93C5FD] text-[#1E3A8A] rounded-full shadow-md animate-pulse">
            ♟️ Start Your Chess Journey with{" "}
            <span className="text-[#3B82F6] font-semibold">Azroute</span> Today!
          </div>
        </motion.div>

        {/* Heading */}
        <div className="text-center max-w-4xl mx-auto mb-14">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-[#60A5FA] to-[#93C5FD] text-transparent bg-clip-text"
          >
            Your Chess Journey Starts at Azroute
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="text-xl text-blue-100"
          >
            Whether you're a beginner or an aspiring master, we offer
            personalized training to unlock your full potential.
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-2xl mx-auto"
        >
          <div className="relative flex-1">
            <MessageSquarePlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Looking to learn or teach chess?"
              className="pl-12 h-14 text-lg bg-white text-[#1E3A8A] border border-blue-200 focus:border-blue-400 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={handleInputChange}
            />
          </div>
          <Button
            onClick={handleSearchClick}
            size="lg"
            className="h-14 px-8 text-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl shadow-md"
          >
            Find Courses
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Popular Topics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
          className="flex flex-wrap justify-center gap-3 mb-20"
        >
          <span className="text-base text-blue-100">Popular Topics:</span>
          {popularTopics.map((topic) => (
            <Link
              key={topic}
              href={`/courses?topic=${topic.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-5 py-2 rounded-full bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 transition duration-200 shadow-sm"
            >
              {topic}
            </Link>
          ))}
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-[#F0F9FF] border border-[#BFDBFE] shadow-md hover:shadow-lg transition duration-300"
              >
                <div className="p-4 rounded-full bg-blue-100 mb-6">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}