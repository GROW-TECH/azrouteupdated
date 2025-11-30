// app/api/teacher/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/mongodb';
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
export async function POST(req) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }

    const formData = await req.formData();
    const file = formData.get('video');
    const title = formData.get('title');
    const description = formData.get('description');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const course = await db.course.create({
      data: {
        title,
        description,
        videoUrl: `/uploads/${fileName}`,
        teacherId: user.id
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
