// app/api/teacher/profile/update/route.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
export async function PUT(request) {
    try {
      const token = await verifyAuth(request);
      const { name, department, phone, location } = await request.json();
      
      await connectDB();
      
      const teacher = await Teacher.findById(token.userId);
      if (!teacher) {
        return Response.json(
          { message: "Teacher not found" },
          { status: 404 }
        );
      }
  
      // Update fields
      teacher.name = name || teacher.name;
      teacher.department = department || teacher.department;
      teacher.phone = phone || teacher.phone;
      teacher.location = location || teacher.location;
  
      await teacher.save();
  
      return Response.json({
        message: "Profile updated successfully",
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          phone: teacher.phone,
          location: teacher.location,
          avatar: teacher.avatar,
        }
      });
  
    } catch (error) {
      console.error('Profile update error:', error);
      return Response.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  }
