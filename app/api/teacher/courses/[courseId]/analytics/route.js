// app/api/teacher/courses/[courseId]/analytics/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Course from '@/models/Course';
import { use } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';

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
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
              if (!user) {
                return NextResponse.json(
                  { error: 'Unauthorized' },
                  { status: 401 }
                );
              }

    const { courseId } =await params
    await connectDB();

    // Verify course ownership
    const course = await Course.findOne({
      _id: new ObjectId(courseId),
      teacherId: user.id
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get date range from query params or default to last 30 days
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    
    const startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Run analytics queries in parallel
    const [
      enrollments,
      revenue,
      completionStats,
      lessonProgress,
      userEngagement,
      reviews
    ] = await Promise.all([
      // Enrollment data
      db.collection('enrollments').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]).toArray(),

      // Revenue data
      db.collection('transactions').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            total: { $sum: "$amount" }
          }
        },
        { $sort: { "_id": 1 } }
      ]).toArray(),

      // Course completion statistics
      db.collection('enrollments').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            updatedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalEnrolled: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
            }
          }
        }
      ]).toArray(),

      // Lesson progress data
      db.collection('lessonProgress').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            updatedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$lessonId",
            completions: { $sum: 1 },
            avgWatchTime: { $avg: "$watchTime" }
          }
        }
      ]).toArray(),

      // User engagement metrics
      db.collection('userEngagement').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            totalViews: { $sum: "$views" },
            totalComments: { $sum: "$comments" },
            avgTimeSpent: { $avg: "$timeSpent" }
          }
        },
        { $sort: { "_id": 1 } }
      ]).toArray(),

      // Review statistics
      db.collection('reviews').aggregate([
        {
          $match: {
            courseId: new ObjectId(courseId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratings: {
              $push: "$rating"
            }
          }
        }
      ]).toArray()
    ]);

    // Calculate rating distribution
    const ratingDistribution = reviews[0]?.ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      enrollmentTrend: enrollments,
      revenueTrend: revenue,
      completion: completionStats[0] || {
        totalEnrolled: 0,
        completed: 0,
        inProgress: 0
      },
      lessonEngagement: lessonProgress,
      engagement: userEngagement,
      reviews: {
        averageRating: reviews[0]?.averageRating || 0,
        totalReviews: reviews[0]?.totalReviews || 0,
        distribution: ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}