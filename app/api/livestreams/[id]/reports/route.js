//app/api/livestreams/[id]/reports/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

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
      email: user.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Get stream report
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json'; // json, csv, excel
    const type = searchParams.get('type') || 'summary'; // summary, detailed, engagement, chat

    await connectDB();

    // Get stream details with all necessary data
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    })
    .populate('attendees', 'name email')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate report data based on type
    let reportData;
    switch (type) {
      case 'summary': {
        reportData = {
          streamInfo: {
            title: stream.title,
            startTime: stream.startedAt,
            endTime: stream.endedAt,
            duration: stream.duration,
            type: stream.type
          },
          statistics: {
            totalViews: stream.statistics.totalViews,
            peakViewers: stream.statistics.peakViewers,
            averageWatchTime: stream.statistics.averageWatchTime,
            totalInteractions: stream.statistics.totalInteractions,
            chatMessages: stream.chat?.length || 0,
            questions: stream.chat?.filter(m => m.type === 'question').length || 0
          },
          participants: {
            total: stream.attendees?.length || 0,
            breakdown: await getParticipantBreakdown(stream)
          }
        };
        break;
      }

      case 'detailed': {
        reportData = {
          ...await getDetailedStats(stream),
          participantTimeline: await getParticipantTimeline(stream),
          engagementMetrics: await getEngagementMetrics(stream),
          technicalStats: await getTechnicalStats(stream)
        };
        break;
      }

      case 'engagement': {
        reportData = {
          overview: await getEngagementOverview(stream),
          timeline: await getEngagementTimeline(stream),
          interactions: await getInteractionBreakdown(stream),
          participantEngagement: await getParticipantEngagement(stream)
        };
        break;
      }

      case 'chat': {
        reportData = {
          messages: stream.chat?.map(msg => ({
            time: msg.timestamp,
            user: msg.userName,
            type: msg.type,
            message: msg.message,
            reactions: msg.reactions?.length || 0
          })) || [],
          analytics: await getChatAnalytics(stream)
        };
        break;
      }
    }

    // Format response based on requested format
    switch (format) {
      case 'csv': {
        const csv = Papa.unparse(flattenData(reportData));
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="stream-report-${type}-${id}.csv"`
          }
        });
      }

      case 'excel': {
        const workbook = new ExcelJS.Workbook();
        await generateExcelReport(workbook, reportData, type);
        const buffer = await workbook.xlsx.writeBuffer();
        
        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="stream-report-${type}-${id}.xlsx"`
          }
        });
      }

      default:
        return NextResponse.json({ report: reportData });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper functions for report generation
async function getParticipantBreakdown(stream) {
  const records = Object.values(stream.participationRecords || {});
  return {
    totalUnique: new Set(records.map(r => r.userId)).size,
    averageSessionDuration: records.reduce((acc, r) => {
      const duration = r.leftAt ? 
        (new Date(r.leftAt) - new Date(r.joinedAt)) / 1000 / 60 : 
        (new Date() - new Date(r.joinedAt)) / 1000 / 60;
      return acc + duration;
    }, 0) / records.length,
    joinTimes: records.map(r => r.joinedAt)
  };
}

async function getDetailedStats(stream) {
  const watchTimeDistribution = {};
  Object.values(stream.participationRecords || {}).forEach(record => {
    const duration = record.leftAt ?
      Math.round((new Date(record.leftAt) - new Date(record.joinedAt)) / 1000 / 60) :
      Math.round((new Date() - new Date(record.joinedAt)) / 1000 / 60);
    const bucket = Math.floor(duration / 5) * 5;
    watchTimeDistribution[`${bucket}-${bucket + 5}`] = 
      (watchTimeDistribution[`${bucket}-${bucket + 5}`] || 0) + 1;
  });

  return {
    watchTimeDistribution,
    participantStats: {
      total: stream.attendees?.length || 0,
      peak: stream.statistics.peakViewers,
      average: Math.round(stream.statistics.totalViews / 2) // Approximate
    },
    interactionStats: {
      chatMessages: stream.chat?.length || 0,
      questions: stream.chat?.filter(m => m.type === 'question').length || 0,
      reactions: stream.chat?.reduce((acc, msg) => acc + (msg.reactions?.length || 0), 0) || 0
    }
  };
}

async function getEngagementMetrics(stream) {
  const participants = Object.entries(stream.participationRecords || {});
  return {
    overallEngagement: calculateEngagementScore(stream),
    participantEngagement: participants.map(([userId, record]) => ({
      userId,
      watchTime: record.leftAt ? 
        (new Date(record.leftAt) - new Date(record.joinedAt)) / 1000 / 60 : 
        (new Date() - new Date(record.joinedAt)) / 1000 / 60,
      interactions: record.interactions || 0,
      chatMessages: stream.chat?.filter(m => m.userId === userId).length || 0
    }))
  };
}

function calculateEngagementScore(stream) {
  const watchTimeScore = Math.min(100, (stream.statistics.averageWatchTime / stream.duration) * 100);
  const interactionScore = Math.min(100, (stream.statistics.totalInteractions / stream.statistics.totalViews) * 50);
  return Math.round((watchTimeScore + interactionScore) / 2);
}

async function generateExcelReport(workbook, data, type) {
  const sheet = workbook.addWorksheet(type.charAt(0).toUpperCase() + type.slice(1));
  
  // Add title
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'Stream Report';
  sheet.getCell('A1').font = { size: 16, bold: true };

  // Add data based on report type
  let row = 3;
  switch (type) {
    case 'summary': {
      sheet.addRow(['Stream Information']);
      Object.entries(data.streamInfo).forEach(([key, value]) => {
        sheet.addRow([key, value]);
      });

      row += 6;
      sheet.addRow(['Statistics']);
      Object.entries(data.statistics).forEach(([key, value]) => {
        sheet.addRow([key, value]);
      });

      row += 6;
      sheet.addRow(['Participant Information']);
      Object.entries(data.participants).forEach(([key, value]) => {
        if (typeof value === 'object') {
          sheet.addRow([key]);
          Object.entries(value).forEach(([subKey, subValue]) => {
            sheet.addRow([`  ${subKey}`, subValue]);
          });
        } else {
          sheet.addRow([key, value]);
        }
      });
      break;
    }

    case 'chat': {
      sheet.addRow(['Time', 'User', 'Type', 'Message', 'Reactions']);
      data.messages.forEach(msg => {
        sheet.addRow([
          new Date(msg.time).toLocaleString(),
          msg.user,
          msg.type,
          msg.message,
          msg.reactions
        ]);
      });
      break;
    }
  }

  // Style worksheet
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 30;
}

function flattenData(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...acc, ...flattenData(value, newKey) };
    }
    return { ...acc, [newKey]: value };
  }, {});
}