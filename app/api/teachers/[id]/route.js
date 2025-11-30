
// app/api/teachers/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import Teacher from '@/models/Teacher';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const teacher = await Teacher.findById(params.id)
      .select('-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires')
      .populate('courses', 'title description')
      .lean();
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(teacher);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teacher details' },
      { status: 500 }
    );
  }
}