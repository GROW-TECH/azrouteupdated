import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import CourseEnrollment from "@/models/CourseEnrollment";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

async function getAuthenticatedUser() {
  const cookieStore =await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    return jwt.verify(token.value, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser();
    const { courseId } =await params;

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Fetch course with populated teacher and reviews
    const course = await Course.findById(courseId)
      .populate({
        path: 'teacherId',
        select: 'name avatar bio expertise'
      })
      .populate({
        path: 'reviews',
        populate: {
          path: 'studentId',
          select: 'name avatar'
        },
        options: { limit: 10, sort: { createdAt: -1 } }
      })
      .lean();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate course statistics
    const stats = {
      totalDuration: 0,
      totalLessons: 0,
      averageRating: 0,
      totalEnrollments: 0
    };

    // Calculate totals from sections and lessons
    if (course.sections) {
      course.sections.forEach(section => {
        if (section.lessons) {
          stats.totalLessons += section.lessons.length;
          section.lessons.forEach(lesson => {
            stats.totalDuration += lesson.duration || 0;
          });
        }
      });
    }

    // Calculate average rating from reviews
    if (course.reviews && course.reviews.length > 0) {
      const totalRating = course.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      stats.averageRating = Number((totalRating / course.reviews.length).toFixed(1));
    }

    // Format course data
    const formattedCourse = {
      ...course,
      sections: course.sections?.map(section => ({
        ...section,
        lessons: section.lessons?.map((lesson, index) => ({
          ...lesson,
          preview: lesson.preview || index === 0,
          // Only include videoUrl if user is enrolled or lesson is preview
          videoUrl: user ? lesson.videoUrl : (lesson.preview || index === 0 ? lesson.videoUrl : null)
        }))
      })),
      teacher: course.teacherId ? {
        id: course.teacherId._id,
        name: course.teacherId.name || '',
        avatar: course.teacherId.avatar || '',
        bio: course.teacherId.bio || '',
        expertise: course.teacherId.expertise || []
      } : null,
      reviews: course.reviews?.map(review => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        student: {
          id: review.studentId._id,
          name: review.studentId.name || '',
          avatar: review.studentId.avatar || ''
        }
      })),
      stats: {
        totalDuration: stats.totalDuration,
        totalLessons: stats.totalLessons,
        averageRating: stats.averageRating,
        totalReviews: course.reviews?.length || 0,
        totalEnrollments: course.enrolledStudents || 0
      }
    };

    // Remove unnecessary fields
    delete formattedCourse.teacherId;
    delete formattedCourse.enrolledStudents;

    // If user is authenticated, fetch their enrollment status
    let enrollment = null;
    if (user) {
      enrollment = await CourseEnrollment.findOne({
        courseId: courseId,
        studentId: user.id
      })
      .select({
        status: 1,
        progress: 1,
        lessonsProgress: 1,
        lastAccessedAt: 1,
        enrolledAt: 1,
        completedAt: 1,
        certificate: 1
      })
      .lean();
    }

    return NextResponse.json({
      course: formattedCourse,
      enrollment,
      success: true
    });

  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch course details',
        message: error.message 
      },
      { status: 500 }
    );
  }
}