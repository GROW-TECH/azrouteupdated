// app/api/teacher/stats/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enrollment from '@/models/CourseEnrollment';
import Course from '@/models/Course';
import Assignment from '@/models/Assignment';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import Transaction from '@/models/Transaction';
import {LiveStream} from '@/models/LiveStream';

async function verifyAuth() {
  const cookieStore =await cookies();
  const token =  cookieStore.get('auth-token');

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
      name: teacher.name,
      email: teacher.email,
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }

    const { db } = await connectDB();
    const teacherId = user.id;

    // Run all queries in parallel for better performance
    const [
      totalStudents,
      coursesData,
      earningsData,
      upcomingClasses,
      assignmentsCount
    ] = await Promise.all([
      // Get total unique students across all courses
      Enrollment
        .distinct('studentId', { teacherId })
        .then(students => students.length),
      
      // Get courses data
      Course
        .find({ teacherId })
        ,
      
      // Get earnings data
      Transaction
        .find({ teacherId })
        ,
      
      // Get upcoming live classes
      LiveStream
        .find({
          teacherId,
          startTime: { $gte: new Date() },
          endTime: { 
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
          }
        })
        ,
      
      // Get total assignments
      Assignment
        .countDocuments({ teacherId })
    ]);

    // Calculate active courses
    const activeCourses = coursesData.filter(
      course => course.status === 'published'
    ).length;

    // Calculate total earnings
    const totalEarnings = earningsData.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    // Calculate course completion rate
    const completionRates = coursesData.map(course => {
      const totalLessons = course.lessons?.length || 0;
      if (totalLessons === 0) return 0;
      
      return (course.completedLessons || 0) / totalLessons * 100;
    });

    const averageCompletionRate = completionRates.length
      ? (completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    return NextResponse.json({
      totalStudents,
      activeCourses,
      totalEarnings,
      upcomingClasses: upcomingClasses.length,
      courseCompletionRate: Math.round(averageCompletionRate),
      totalAssignments: assignmentsCount
    });
    
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
