// components/CTASection.jsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";
export default function CTASection() {
  const router = useRouter();
    return (
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of dental professionals improving their skills with ConnectEd
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push('/courses')} variant="secondary" size="lg">
                Browse Courses
              </Button>
              <Button onClick={() => router.push('/auth/teacher/login')} variant="outline" size="lg" className="bg-white/10">
                Become a Teacher
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  