// app/api/courses/[courseId]/discussions/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Discussion from "@/models/Discussion";
import Course from "@/models/Course";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUser(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token.value, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Get discussions
export async function GET(request, { params }) {
  try {
    const user = await getUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await connectDB();

    // Build query
    let query = { courseId, status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    switch (filter) {
      case 'questions':
        query.type = 'question';
        break;
      case 'announcements':
        query.type = 'announcement';
        break;
      case 'solved':
        query.type = 'question';
        query.solved = true;
        break;
      case 'pinned':
        query.pinned = true;
        break;
    }

    // Execute query with pagination
    const discussions = await Discussion.find(query)
      .sort({ pinned: -1, lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'firstName lastName email profileImage')
      .lean();

    // Get total count
    const total = await Discussion.countDocuments(query);

    // Format discussions and add user vote info
    const formattedDiscussions = discussions.map(discussion => ({
      id: discussion._id,
      title: discussion.title,
      content: discussion.content,
      type: discussion.type,
      pinned: discussion.pinned,
      solved: discussion.solved,
      votes: discussion.votes,
      views: discussion.views,
      replyCount: discussion.replies?.length || 0,
      tags: discussion.tags,
      createdAt: discussion.createdAt,
      lastActivity: discussion.lastActivity,
      author: {
        id: discussion.authorId._id,
        name: `${discussion.authorId.firstName} ${discussion.authorId.lastName}`,
        email: discussion.authorId.email,
        avatar: discussion.authorId.profileImage
      },
      userVote: discussion.voters.find(v => v.userId.equals(user.id))?.voteType,
      replies: discussion.replies?.map(reply => ({
        id: reply._id,
        content: reply.content,
        votes: reply.votes,
        createdAt: reply.createdAt,
        author: {
          id: reply.authorId,
          name: `${reply.authorFirstName} ${reply.authorLastName}`,
          email: reply.authorEmail,
          avatar: reply.authorProfileImage
        },
        isTeacherResponse: reply.isTeacherResponse,
        userVote: reply.voters.find(v => v.userId.equals(user.id))?.voteType
      }))
    }));

    return NextResponse.json({
      discussions: formattedDiscussions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

// Create new discussion
export async function POST(request, { params }) {
  try {
    const user = await getUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const body = await request.json();
    const { title, content, type, tags } = body;

    await connectDB();

    // Verify course enrollment
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create discussion
    const discussion = new Discussion({
      courseId,
      title,
      content,
      type,
      tags,
      authorId: user.id,
      authorType: user.role,
      status: 'active'
    });

    await discussion.save();

    return NextResponse.json({
      message: 'Discussion created successfully',
      discussion: {
        id: discussion._id,
        title: discussion.title,
        content: discussion.content,
        type: discussion.type,
        tags: discussion.tags,
        createdAt: discussion.createdAt,
        author: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        votes: 0,
        replies: []
      }
    });

  } catch (error) {
    console.error('Error creating discussion:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}