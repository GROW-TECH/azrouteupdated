// components/Pricing.jsx
'use client';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const router = useRouter();
  const features = [
    "Community spaces",
    "Course creation tools",
    "Video conferencing",
    "Group chat",
    "Member directory",
    "Resource hosting",
    "Private messaging",
    "Analytics dashboard"
  ];

  return (
    <section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">
        Join the Chess Academy and unlock premium tools to grow your coaching business. One-time setup, no hidden charges.
      </h2>
      
    </div>

    <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">What You Get:</h3>
        <div className="space-y-4">
          {[
            "Launch your own chess courses",
            "Host interactive classes and tournaments",
            "Earn income directly from enrolled students",
            "Access instructor tools and analytics",
            "Dedicated support team",
          ].map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  </div>
</section>

  );
}