// app/dashboard/teacher/students/[studentId]/performance/page.js
import { StudentPerformance } from "@/components/performance/StudentPerformance";

export default function StudentPerformancePage({ params }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Student Performance</h1>
      </div>
      <StudentPerformance studentId={params.studentId} />
    </div>
  );
}