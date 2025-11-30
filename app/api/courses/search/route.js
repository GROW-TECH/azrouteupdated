// app/api/courses/search/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const price = searchParams.get('price');
    const sort = searchParams.get('sort') || 'popular';

    await connectDB();

    // Build base query
    let query = {
      status: 'published'
    };

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add level filter
    if (level && level !== 'all') {
      query.level = level;
    }

    // Add price filter
    if (price === 'free') {
      query.price = 0;
    } else if (price === 'paid') {
      query.price = { $gt: 0 };
    }

    // Define sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      rating: { rating: -1 },
      popular: { enrolledStudents: -1 }
    };

    // Get the appropriate sort object
    const sortQuery = sortOptions[sort] || sortOptions.popular;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const courses = await Course.find(query)
      .populate({
        path: 'teacherId',
        select: 'firstName lastName email profileImage department qualification experience subjectsToTeach',
        model: 'Teacher'
      })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalCourses = await Course.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCourses / limit);

    // Format the response
    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      discountedPrice: course.discountedPrice,
      level: course.level,
      category: course.category,
      rating: course.rating,
      totalRatings: course.totalRatings,
      enrolledStudents: course.enrolledStudents,
      totalDuration: course.totalDuration,
      totalLessons: course.totalLessons,
      featured: course.featured,
      createdAt: course.createdAt,
      teacher: course.teacherId ? {
        id: course.teacherId._id,
        name: `${course.teacherId.firstName} ${course.teacherId.lastName}`,
        email: course.teacherId.email,
        avatar: course.teacherId.profileImage,
        department: course.teacherId.department,
        qualification: course.teacherId.qualification,
        experience: course.teacherId.experience,
        subjects: course.teacherId.subjectsToTeach
      } : null
    }));

    return NextResponse.json({
      courses: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Course search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error.message },
      { status: 500 }
    );
  }
}
