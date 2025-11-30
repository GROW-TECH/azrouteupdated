// app/students/page.js
import { Button } from '@/components/ui/button';

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-200">
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Hey students, your learning journey starts here
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Open the doors to innovation and growth in your educational journey
          </p>
          <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
            Join as Student
          </Button>
        </div>
      </div>
    </div>
  );
}