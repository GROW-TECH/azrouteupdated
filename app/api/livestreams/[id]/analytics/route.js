//app/api/livestreams/[id]/analytics/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.userId).select('-password');

    if (!teacher) return null;

    return {
      id: teacher._id.toString(),
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } =await params;
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '1h'; // 1h, 24h, 7d, 30d

    // Convert timeRange to milliseconds
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(Date.now() - timeRanges[timeRange]);

    // Get stream analytics
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $project: {
          viewerStats: {
            current: { $size: '$attendees' },
            peak: '$statistics.peakViewers',
            total: '$statistics.totalViews'
          },
          participationStats: {
            totalMessages: { $size: '$chat' },
            totalQuestions: {
              $size: {
                $filter: {
                  input: '$chat',
                  cond: { $eq: ['$$this.type', 'question'] }
                }
              }
            }
          },
          interactionStats: {
            avgWatchTime: '$statistics.averageWatchTime',
            totalInteractions: '$statistics.totalInteractions'
          },
          timeStats: {
            startTime: '$startedAt',
            duration: {
              $divide: [
                { $subtract: [new Date(), '$startedAt'] },
                60000 // Convert to minutes
              ]
            }
          },
          participantHistory: {
            $filter: {
              input: '$participationRecords',
              cond: {
                $gte: ['$$this.joinedAt', startTime]
              }
            }
          }
        }
      }
    ];

    const [analytics] = await LiveStream.aggregate(pipeline);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Process viewer retention
    const retentionData = analytics.participantHistory.reduce((acc, record) => {
      const watchTime = record.leftAt
        ? (new Date(record.leftAt) - new Date(record.joinedAt)) / 60000 // minutes
        : (Date.now() - new Date(record.joinedAt)) / 60000;

      const bucket = Math.floor(watchTime / 5) * 5; // 5-minute buckets
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {});

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (analytics.interactionStats.totalInteractions / analytics.viewerStats.total) * 50 +
      (analytics.interactionStats.avgWatchTime / analytics.timeStats.duration) * 50
    ));

    return NextResponse.json({
      viewerStats: analytics.viewerStats,
      participationStats: analytics.participationStats,
      interactionStats: analytics.interactionStats,
      timeStats: analytics.timeStats,
      retentionData,
      engagementScore
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Get real-time analytics updates
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } =await params;

    // Get current stream stats
    const stream = await LiveStream.findById(id).select('attendees',
      'statistics',
      'chat',
      'participationRecords').lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Calculate real-time metrics
    const now = Date.now();
    const activeParticipants = stream.participationRecords.filter(
      record => !record.leftAt || new Date(record.leftAt) > now - 30000 // Active in last 30s
    );

    const recentMessages = stream.chat.filter(
      msg => new Date(msg.timestamp) > now - 300000 // Last 5 minutes
    );

    return NextResponse.json({
      currentViewers: stream.attendees.length,
      activeParticipants: activeParticipants.length,
      messageRate: recentMessages.length / 5, // Messages per minute
      peakViewers: stream.statistics.peakViewers,
      totalInteractions: stream.statistics.totalInteractions,
      // Additional real-time metrics
      participantMetrics: {
        newJoins: activeParticipants.filter(
          p => new Date(p.joinedAt) > now - 300000
        ).length,
        avgWatchTime: activeParticipants.reduce(
          (acc, p) => acc + ((p.leftAt ? new Date(p.leftAt) : now) - new Date(p.joinedAt)),
          0
        ) / activeParticipants.length / 60000, // Average in minutes
      },
      interactionMetrics: {
        questionsCount: recentMessages.filter(m => m.type === 'question').length,
        chatActivity: recentMessages.length
      }
    });

  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}