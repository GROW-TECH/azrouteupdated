// app/api/student/analytics/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getStudentAnalytics } from '@/lib/analytics/livestream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.userId).select('-password');

    if (!student) return null;

    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      role: 'student'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period')) || 30;

    const analytics = await getStudentAnalytics(user.id, period);

    // Calculate engagement score
    analytics.engagementScore = calculateEngagementScore({
      watchTime: analytics.totalWatchTime,
      interactions: analytics.totalInteractions,
      chatMessages: analytics.chatMessages,
      questionsAsked: analytics.questionsAsked
    });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
