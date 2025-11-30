// app/api/courses/[courseId]/route.js
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const {courseId}=await params
    const course = await Course.findById(courseId)
      .populate('teacherId', 'teacherName')
      .lean();
    console.log("course",course)
    if (!course) {
      return Response.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return Response.json({ course });
  } catch (error) {
    console.error('Course fetch error:', ercourseIdror);
    return Response.json(
      { message: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
