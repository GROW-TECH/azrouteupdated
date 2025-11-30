//app/api/livestreams/[id]/feedback/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const user = decoded.role === 'teacher' ? 
      await Teacher.findById(decoded.userId).select('-password') :
      await Student.findById(decoded.userId).select('-password');

    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Get stream feedback
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    await connectDB();

    // Teachers can see all feedback, students only their own
    const query = {
      _id: id,
      ...user.role === 'student' && {
        'feedback.userId': user.id
      }
    };

    const stream = await LiveStream.findOne(query)
      .select('feedback')
      .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate feedback statistics
    const feedback = stream.feedback || [];
    const stats = {
      averageRating: feedback.reduce((acc, f) => acc + f.rating, 0) / (feedback.length || 1),
      totalFeedback: feedback.length,
      ratingDistribution: feedback.reduce((acc, f) => {
        acc[f.rating] = (acc[f.rating] || 0) + 1;
        return acc;
      }, {}),
      categories: feedback.reduce((acc, f) => {
        f.categories?.forEach(cat => {
          acc[cat] = (acc[cat] || 0) + 1;
        });
        return acc;
      }, {})
    };

    return NextResponse.json({
      feedback: user.role === 'teacher' ? feedback : feedback.filter(f => f.userId === user.id),
      stats: user.role === 'teacher' ? stats : undefined
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Submit feedback
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const {
      rating,
      categories = [],
      comment,
      technicalIssues = []
    } = await req.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user has already submitted feedback
    const existingFeedback = await LiveStream.findOne({
      _id: id,
      'feedback.userId': user.id
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted' },
        { status: 400 }
      );
    }

    // Add feedback
    const stream = await LiveStream.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          feedback: {
            userId: user.id,
            userName: user.name,
            rating,
            categories,
            comment,
            technicalIssues,
            submittedAt: new Date()
          }
        },
        $inc: {
          'statistics.totalFeedback': 1,
          'statistics.totalRating': rating
        }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Update average rating
    await LiveStream.updateOne(
      { _id: id },
      {
        $set: {
          'statistics.averageRating': 
            stream.statistics.totalRating / stream.statistics.totalFeedback
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update feedback
export async function PATCH(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const updates = await req.json();
    await connectDB();

    // Find user's feedback
    const stream = await LiveStream.findOne({
      _id: id,
      'feedback.userId': user.id
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Calculate rating difference for statistics update
    const oldFeedback = stream.feedback.find(f => f.userId === user.id);
    const ratingDiff = (updates.rating || oldFeedback.rating) - oldFeedback.rating;

    // Update feedback
    const result = await LiveStream.updateOne(
      {
        _id: id,
        'feedback.userId': user.id
      },
      {
        $set: {
          'feedback.$.rating': updates.rating || oldFeedback.rating,
          'feedback.$.categories': updates.categories || oldFeedback.categories,
          'feedback.$.comment': updates.comment || oldFeedback.comment,
          'feedback.$.technicalIssues': updates.technicalIssues || oldFeedback.technicalIssues,
          'feedback.$.updatedAt': new Date()
        },
        $inc: {
          'statistics.totalRating': ratingDiff
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    // Update average rating
    const updatedStream = await LiveStream.findById(id);
    await LiveStream.updateOne(
      { _id: id },
      {
        $set: {
          'statistics.averageRating': 
            updatedStream.statistics.totalRating / updatedStream.statistics.totalFeedback
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Delete feedback
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    await connectDB();

    // Only teachers can delete any feedback, students can delete their own
    const query = {
      _id: id,
      ...user.role === 'student' && {
        'feedback.userId': user.id
      }
    };

    const stream = await LiveStream.findOne(query);
    if (!stream) {
      return NextResponse.json(
        { error: 'Feedback not found or unauthorized' },
        { status: 404 }
      );
    }

    const feedbackToDelete = user.role === 'student' ?
      stream.feedback.find(f => f.userId === user.id) :
      stream.feedback.find(f => f._id.toString() === req.body.feedbackId);

    if (!feedbackToDelete) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Remove feedback and update statistics
    await LiveStream.updateOne(
      { _id: id },
      {
        $pull: {
          feedback: user.role === 'student' ?
            { userId: user.id } :
            { _id: feedbackToDelete._id }
        },
        $inc: {
          'statistics.totalFeedback': -1,
          'statistics.totalRating': -feedbackToDelete.rating
        }
      }
    );

    // Update average rating
    const updatedStream = await LiveStream.findById(id);
    if (updatedStream.statistics.totalFeedback > 0) {
      await LiveStream.updateOne(
        { _id: id },
        {
          $set: {
            'statistics.averageRating': 
              updatedStream.statistics.totalRating / updatedStream.statistics.totalFeedback
          }
        }
      );
    } else {
      // Reset statistics if no feedback left
      await LiveStream.updateOne(
        { _id: id },
        {
          $set: {
            'statistics.averageRating': 0,
            'statistics.totalRating': 0
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}