 // app/api/student/livestreams/[streamId]/heartbeat/route.js
 
 import { NextResponse } from 'next/server';
 import { connectDB } from '@/lib/mongodb';
 import { ObjectId } from 'mongodb';
 import { LiveStream } from '@/models/LiveStream';
 import { cookies } from 'next/headers';
 import jwt from 'jsonwebtoken';
 import Student from '@/models/Student';
 
 async function verifyAuth() {
   const cookieStore = await cookies();
   const token = cookieStore.get('auth-token');
 
   if (!token) {
     return null;
   }
 
   try {
     const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
     const student = await Student.findById(decoded.userId).select('-password');
 
     if (!student) {
       return null;
     }
 
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

 export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    await connectDB();

    // Update last active timestamp
    const result = await LiveStream.findOneAndUpdate(
      { _id: new ObjectId(streamId) },
      {
        $set: {
          [`participationRecords.${user.id}.lastActive`]: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      viewerCount: result.attendees.length
    });

  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
  
  