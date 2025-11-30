// app/api/teacher/verification/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Teacher from '@/models/Teacher';
import { getAuthToken } from '@/lib/auth';


export async function POST(request) {
  try {
    await connectDB();

    const token = await getAuthToken();
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }

    const { teacherId, status, reason } = await request.json();

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $set: {
          verificationStatus: status,
          'verificationDetails.reason': reason,
          'verificationDetails.date': new Date(),
          'verificationDetails.verifiedBy': token.id
        }
      },
      { new: true }
    );

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Send email notification to teacher about verification status
    // await sendVerificationEmail(teacher, status);

    return NextResponse.json({
      message: `Teacher ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      teacher
    });
  } catch (error) {
    console.error('Teacher verification error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
