// components/TeacherCTA.jsx
'use client';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function TeacherCTA() {
  const router = useRouter();

  const benefits = [
    "Create and sell your own courses",
    "Host live training sessions",
    "Build your professional network",
    "Earn from your expertise"
  ];

  return (
    <section className="py-16 bg-primary text-white">
  <div className="container mx-auto px-4">
    <div className="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="text-4xl font-bold mb-4">Become a Chess Coach</h2>
        <p className="text-lg mb-6">
          Share your chess mastery with passionate learners and earn doing what you love.
        </p>
        <ul className="space-y-4 text-white/90">
          {[
            'Create and sell your chess courses',
            'Host live coaching sessions and tournaments',
            'Build your global student base',
            'Earn revenue from your expertise',
          ].map((item, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link href="/teach">
          <Button
            onClick={() => router.push('/auth/coach/signup')}
            variant="secondary"
            size="lg"
            className="mt-8"
          >
            Start Coaching
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="relative">
        <Card className="bg-white text-black shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-semibold">Zero Upfront Costs</h3>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Join the platform without any subscription. We take only 15% per course sale.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span>Keep 85% of your course earnings</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span>No hidden fees or lock-ins</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span>Direct withdrawals to your account</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-secondary/30 rounded-full blur-3xl" />
      </div>
    </div>
  </div>
</section>


  );
}