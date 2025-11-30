// app/api/teacher/courses/[courseId]/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.userId).select('-password');

    if (!teacher) {
      return null;
    }

    return {
      id: teacher._id.toString(),
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      department: teacher.department,
      qualification: teacher.qualification,
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Add GET method to handle course retrieval
export async function GET(request, { params }) {
  try {
    const user = await verifyAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    await connectDB();

    // Find course with populated teacher information
    const course = await Course.findById(courseId)
      .populate('teacherId', 'firstName lastName email profileImage department qualification experience subjectsToTeach bio')
      .lean();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      discountedPrice: course.discountedPrice,
      level: course.level,
      category: course.category,
      enrollments: course.enrolledStudents,
      rating: course.rating,
      totalDuration: course.totalDuration,
      totalLessons: course.totalLessons,
      language: course.language,
      tags: course.tags || [],
      prerequisites: course.requirements || [],
      objectives: course.objectives || [],
      status: course.status,
      featured: course.featured,
      completionCriteria: {
        minWatchPercentage: course.completionCriteria?.minWatchPercentage,
        requireQuizzes: course.completionCriteria?.requireQuizzes,
        minQuizScore: course.completionCriteria?.minQuizScore
      },
      reviews: course.reviews || [],
      lastUpdated: course.lastUpdated,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      slug: course.slug,
      teacher: course.teacherId ? {
        id: course.teacherId._id,
        firstName: course.teacherId.firstName,
        lastName: course.teacherId.lastName,
        name: `${course.teacherId.firstName} ${course.teacherId.lastName}`,
        email: course.teacherId.email,
        avatar: course.teacherId.profileImage,
        department: course.teacherId.department,
        qualification: course.teacherId.qualification,
        experience: course.teacherId.experience,
        subjects: course.teacherId.subjectsToTeach,
        bio: course.teacherId.bio
      } : null,
      sections: course.sections.map(section => ({
        id: section._id,
        title: section.title,
        description: section.description || "",
        order: section.order,
        lessons: section.lessons.map(lesson => ({
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          resources: lesson.resources || [],
          order: lesson.order
        }))
      }))
    };

    return NextResponse.json({ course: formattedCourse });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await verifyAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const updates = await request.json();

    await connectDB();

    // Verify course ownership
    const course = await Course.findOne({
      _id: courseId,
      teacherId: user.id
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate total duration and lessons if content is being updated
    if (updates.sections) {
      let totalDuration = 0;
      let totalLessons = 0;

      updates.sections.forEach(section => {
        totalLessons += section.lessons.length;
        section.lessons.forEach(lesson => {
          totalDuration += lesson.duration || 0;
        });
      });

      updates.totalDuration = totalDuration;
      updates.totalLessons = totalLessons;
    }

    // Handle status changes
    if (updates.status && updates.status !== course.status) {
      if (updates.status === 'published') {
        // Validate course before publishing
        const validationErrors = await validateCourseForPublishing(course);
        if (validationErrors.length > 0) {
          return NextResponse.json(
            { error: 'Course validation failed', validationErrors },
            { status: 400 }
          );
        }
      }

      // Record status change history
      course.statusHistory = course.statusHistory || [];
      course.statusHistory.push({
        from: course.status,
        to: updates.status,
        changedAt: new Date(),
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`
      });
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { 
        $set: updates,
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('teacherId', 'firstName lastName email profileImage department qualification experience subjectsToTeach bio');

    return NextResponse.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

async function validateCourseForPublishing(course) {
  const errors = [];

  // Basic validation
  if (!course.title) errors.push('Course title is required');
  if (!course.description) errors.push('Course description is required');
  if (!course.thumbnail) errors.push('Course thumbnail is required');
  if (!course.category) errors.push('Course category is required');
  if (!course.level) errors.push('Course level is required');
  
  // Content validation
  if (!course.sections?.length) {
    errors.push('At least one section is required');
  } else {
    course.sections.forEach((section, sIndex) => {
      if (!section.title) {
        errors.push(`Section ${sIndex + 1} title is required`);
      }
      if (!section.lessons?.length) {
        errors.push(`Section ${sIndex + 1} must have at least one lesson`);
      } else {
        section.lessons.forEach((lesson, lIndex) => {
          if (!lesson.title) {
            errors.push(`Lesson ${lIndex + 1} in Section ${sIndex + 1} title is required`);
          }
          if (!lesson.videoUrl) {
            errors.push(`Lesson ${lIndex + 1} in Section ${sIndex + 1} video is required`);
          }
        });
      }
    });
  }

  // Learning objectives validation
  if (!course.objectives?.length) {
    errors.push('At least one learning objective is required');
  }

  // Requirements validation
  if (!course.requirements?.length) {
    errors.push('At least one course requirement is required');
  }

  return errors;
}