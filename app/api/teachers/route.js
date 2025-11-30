// app/api/teachers/route.js
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import Teacher from '@/models/Teacher';

export async function GET() {
  try {
    await connectDB();
    
    const teachers = await Teacher.find({})
      .select('firstName lastName department qualification subjectsToTeach profileImage')
      .sort({ lastName: 1 });
    
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}
