// // lib/analytics/livestream.js
// import { connectDB } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { LiveStream } from '@/models/LiveStream';
// import Student from '@/models/Student';

// export async function getStudentAnalytics(studentId, period = 30) {
//   await connectDB();

//   const startDate = new Date();
//   startDate.setDate(startDate.getDate() - period);

//   const analytics = {
//     totalWatchTime: 0,
//     totalInteractions: 0,
//     sessionsAttended: 0,
//     attendanceRate: 0,
//     chatMessages: 0,
//     questionsAsked: 0,
//     handRaises: 0,
//     engagementScore: 0,
//     watchTimeByDay: [],
//     recentSessions: []
//   };

//   try {
//     // Get all streams the student attended
//     const streams = await LiveStream.find({
//       attendees: new ObjectId(studentId),
//       startedAt: { $gte: startDate }
//     }).sort({ startedAt: -1 }).lean();

//     // Calculate total sessions and attendance rate
//     const totalAvailableStreams = await LiveStream.countDocuments({
//       startedAt: { $gte: startDate }
//     });

//     analytics.sessionsAttended = streams.length;
//     analytics.attendanceRate = totalAvailableStreams > 0 
//       ? (streams.length / totalAvailableStreams) * 100 
//       : 0;

//     // Process each stream for detailed analytics
//     for (const stream of streams) {
//       // Get participation record for this student
//       const participation = stream.participationRecords?.get(studentId);
//       if (!participation) continue;

//       // Calculate watch time
//       const watchTime = participation.leftAt 
//         ? Math.round((participation.leftAt - participation.joinedAt) / 1000 / 60)
//         : 0;

//       analytics.totalWatchTime += watchTime;
//       analytics.totalInteractions += participation.interactions || 0;

//       // Count chat messages and questions
//       const studentMessages = stream.chat.filter(msg => msg.userId === studentId);
//       analytics.chatMessages += studentMessages.length;
//       analytics.questionsAsked += studentMessages.filter(msg => msg.type === 'question').length;

//       // Add to watchTimeByDay
//       const date = new Date(stream.startedAt).toISOString().split('T')[0];
//       const dayIndex = analytics.watchTimeByDay.findIndex(day => day.date === date);
//       if (dayIndex >= 0) {
//         analytics.watchTimeByDay[dayIndex].watchTime += watchTime;
//         analytics.watchTimeByDay[dayIndex].interactions += participation.interactions || 0;
//       } else {
//         analytics.watchTimeByDay.push({
//           date,
//           watchTime,
//           interactions: participation.interactions || 0
//         });
//       }
//     }

//     // Get recent sessions with more details
//     analytics.recentSessions = await LiveStream.find({
//       attendees: new ObjectId(studentId)
//     })
//     .sort({ startedAt: -1 })
//     .limit(5)
//     .lean()
//     .then(sessions => sessions.map(session => ({
//       _id: session._id,
//       title: session.title,
//       watchTime: Math.round(
//         (new Date(session.endedAt) - new Date(session.startedAt)) / 1000 / 60
//       ),
//       interactions: session.participationRecords?.get(studentId)?.interactions || 0,
//       engagement: calculateEngagementScore(session, studentId)
//     })));

//     return analytics;

//   } catch (error) {
//     console.error('Error calculating student analytics:', error);
//     throw error;
//   }
// }

// export async function getTeacherAnalytics(teacherId, period = 30) {
//   await connectDB();

//   const startDate = new Date();
//   startDate.setDate(startDate.getDate() - period);

//   try {
//     // Get streams for this period
//     const streams = await LiveStream.find({
//       teacherId: new ObjectId(teacherId),
//       startedAt: { $gte: startDate }
//     }).lean();

//     const analytics = {
//       totalStreams: streams.length,
//       totalStudents: 0,
//       averageAttendance: 0,
//       averageWatchTime: 0,
//       totalInteractions: 0,
//       engagementRate: 0,
//       studentGrowth: 0,
//       streams: [],
//       topSessions: [],
//       attendanceByDay: []
//     };

//     // Calculate stream statistics
//     let totalAttendees = 0;
//     let totalWatchTime = 0;

//     for (const stream of streams) {
//       totalAttendees += stream.attendees?.length || 0;
      
//       // Calculate total watch time for this stream
//       const streamWatchTime = Array.from(stream.participationRecords || [])
//         .reduce((total, [_, record]) => {
//           const watchTime = record.leftAt 
//             ? Math.round((record.leftAt - record.joinedAt) / 1000 / 60)
//             : 0;
//           return total + watchTime;
//         }, 0);

//       totalWatchTime += streamWatchTime;

//       // Add to streams array with engagement metrics
//       analytics.streams.push({
//         _id: stream._id,
//         title: stream.title,
//         startedAt: stream.startedAt,
//         attendees: stream.attendees?.length || 0,
//         watchTime: streamWatchTime,
//         interactions: stream.statistics?.totalInteractions || 0,
//         engagement: calculateStreamEngagement(stream)
//       });
//     }

//     analytics.averageAttendance = streams.length > 0 
//       ? totalAttendees / streams.length 
//       : 0;
//     analytics.averageWatchTime = totalAttendees > 0 
//       ? totalWatchTime / totalAttendees 
//       : 0;

//     // Get top performing sessions
//     analytics.topSessions = [...analytics.streams]
//       .sort((a, b) => b.engagement - a.engagement)
//       .slice(0, 5);

//     // Calculate attendance by day
//     const attendanceMap = new Map();
//     for (const stream of streams) {
//       const date = new Date(stream.startedAt).toISOString().split('T')[0];
//       const current = attendanceMap.get(date) || { count: 0, totalWatchTime: 0 };
//       current.count += stream.attendees?.length || 0;
//       current.totalWatchTime += Array.from(stream.participationRecords || [])
//         .reduce((total, [_, record]) => {
//           return total + (record.leftAt - record.joinedAt) / 1000 / 60;
//         }, 0);
//       attendanceMap.set(date, current);
//     }

//     analytics.attendanceByDay = Array.from(attendanceMap.entries())
//       .map(([date, data]) => ({
//         date,
//         count: data.count,
//         averageWatchTime: data.count > 0 ? data.totalWatchTime / data.count : 0
//       }))
//       .sort((a, b) => a.date.localeCompare(b.date));

//     return analytics;

//   } catch (error) {
//     console.error('Error calculating teacher analytics:', error);
//     throw error;
//   }
// }

// // Helper functions
// function calculateEngagementScore(stream, studentId) {
//   const participation = stream.participationRecords?.get(studentId);
//   if (!participation) return 0;

//   const watchTime = participation.leftAt 
//     ? (participation.leftAt - participation.joinedAt) / 1000 / 60
//     : 0;
//   const streamDuration = (stream.endedAt - stream.startedAt) / 1000 / 60;
  
//   const watchTimeScore = Math.min(watchTime / streamDuration, 1) * 40;
//   const interactionsScore = Math.min(participation.interactions / 10, 1) * 30;
  
//   const studentMessages = stream.chat.filter(msg => msg.userId === studentId);
//   const chatScore = Math.min(studentMessages.length / 5, 1) * 20;
//   const questionsScore = Math.min(
//     studentMessages.filter(msg => msg.type === 'question').length / 2,
//     1
//   ) * 10;

//   return Math.round(watchTimeScore + interactionsScore + chatScore + questionsScore);
// }

// function calculateStreamEngagement(stream) {
//   const totalDuration = (stream.endedAt - stream.startedAt) / 1000 / 60;
//   const participants = stream.attendees?.length || 0;
  
//   if (participants === 0) return 0;

//   const totalWatchTime = Array.from(stream.participationRecords || [])
//     .reduce((total, [_, record]) => {
//       return total + (record.leftAt - record.joinedAt) / 1000 / 60;
//     }, 0);

//   const avgWatchTime = totalWatchTime / participants;
//   const watchTimeScore = Math.min(avgWatchTime / totalDuration, 1) * 40;

//   const avgInteractions = (stream.statistics?.totalInteractions || 0) / participants;
//   const interactionsScore = Math.min(avgInteractions / 5, 1) * 30;

//   const chatMessages = stream.chat?.length || 0;
//   const chatScore = Math.min(chatMessages / (participants * 3), 1) * 30;

//   return Math.round(watchTimeScore + interactionsScore + chatScore);
// }

// lib/analytics/livestream.js
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { LiveStream } from '@/models/LiveStream';
import Student from '@/models/Student';

// Helper function to calculate engagement score
function calculateEngagementScore(watchTime, interactions, chatMessages, questionsAsked) {
  const watchTimeScore = Math.min((watchTime / 60), 1) * 40; // 40% weight
  const interactionsScore = Math.min((interactions / 10), 1) * 30; // 30% weight
  const chatScore = Math.min((chatMessages / 5), 1) * 20; // 20% weight
  const questionsScore = Math.min((questionsAsked / 2), 1) * 10; // 10% weight

  return Math.round(watchTimeScore + interactionsScore + chatScore + questionsScore);
}

// Get teacher analytics
export async function getTeacherAnalytics(teacherId, period = 30) {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  try {
    // Get all streams in the period
    const streams = await LiveStream.find({
      teacherId: new ObjectId(teacherId),
      startedAt: { $gte: startDate }
    }).lean();

    // Calculate basic metrics
    const totalStreams = streams.length;
    let totalStudents = 0;
    let totalWatchTime = 0;
    let totalInteractions = 0;
    let totalChatMessages = 0;
    let peakConcurrentViewers = 0;

    // Process each stream
    const streamData = await Promise.all(streams.map(async stream => {
      const attendeeCount = stream.attendees?.length || 0;
      totalStudents += attendeeCount;
      peakConcurrentViewers = Math.max(peakConcurrentViewers, stream.statistics?.peakViewers || 0);

      // Calculate stream-specific metrics
      const streamWatchTime = Object.values(stream.participationRecords || {}).reduce((total, record) => {
        return total + (record.watchTime || 0);
      }, 0);

      totalWatchTime += streamWatchTime;
      totalInteractions += stream.statistics?.totalInteractions || 0;
      totalChatMessages += stream.chat?.length || 0;

      return {
        id: stream._id,
        title: stream.title,
        date: stream.startedAt,
        attendees: attendeeCount,
        watchTime: streamWatchTime,
        interactions: stream.statistics?.totalInteractions || 0,
        engagement: calculateEngagementScore(
          streamWatchTime,
          stream.statistics?.totalInteractions || 0,
          stream.chat?.length || 0,
          stream.chat?.filter(msg => msg.type === 'question').length || 0
        )
      };
    }));

    // Calculate trends and growth
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - period);

    const previousStreams = await LiveStream.countDocuments({
      teacherId: new ObjectId(teacherId),
      startedAt: {
        $gte: previousPeriodStart,
        $lt: startDate
      }
    });

    const streamGrowth = previousStreams > 0 
      ? ((totalStreams - previousStreams) / previousStreams) * 100 
      : 0;

    // Get top performing streams
    const topStreams = [...streamData]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Calculate attendance by day
    const attendanceByDay = streams.reduce((acc, stream) => {
      const date = stream.startedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += stream.attendees?.length || 0;
      acc[date].count += 1;
      return acc;
    }, {});

    // Final analytics object
    return {
      overview: {
        totalStreams,
        uniqueStudents: new Set(streams.flatMap(s => s.attendees || [])).size,
        averageAttendance: totalStreams > 0 ? totalStudents / totalStreams : 0,
        averageWatchTime: totalStudents > 0 ? totalWatchTime / totalStudents : 0,
        streamGrowth,
        peakConcurrentViewers
      },
      engagement: {
        totalInteractions,
        totalChatMessages,
        averageInteractionsPerStudent: totalStudents > 0 ? totalInteractions / totalStudents : 0,
        averageMessagesPerStream: totalStreams > 0 ? totalChatMessages / totalStreams : 0
      },
      topStreams,
      trends: {
        attendanceByDay: Object.entries(attendanceByDay).map(([date, data]) => ({
          date,
          averageAttendance: data.count > 0 ? data.total / data.count : 0
        }))
      },
      streamData
    };

  } catch (error) {
    console.error('Error calculating teacher analytics:', error);
    throw error;
  }
}

// Get student analytics
export async function getStudentAnalytics(studentId, period = 30) {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  try {
    // Get all streams the student attended
    const streams = await LiveStream.find({
      attendees: new ObjectId(studentId),
      startedAt: { $gte: startDate }
    }).lean();

    let totalWatchTime = 0;
    let totalInteractions = 0;
    let totalChatMessages = 0;
    let totalQuestions = 0;

    // Process each stream
    const streamDetails = streams.map(stream => {
      const participation = stream.participationRecords?.[studentId] || {};
      const watchTime = participation.watchTime || 0;
      const interactions = participation.interactions || 0;
      const chatMessages = stream.chat?.filter(msg => msg.userId === studentId) || [];
      const questions = chatMessages.filter(msg => msg.type === 'question').length;

      totalWatchTime += watchTime;
      totalInteractions += interactions;
      totalChatMessages += chatMessages.length;
      totalQuestions += questions;

      return {
        streamId: stream._id,
        title: stream.title,
        date: stream.startedAt,
        watchTime,
        interactions,
        engagement: calculateEngagementScore(watchTime, interactions, chatMessages.length, questions)
      };
    });

    // Calculate attendance rate
    const totalAvailableStreams = await LiveStream.countDocuments({
      startedAt: { $gte: startDate }
    });

    // Return analytics
    return {
      overview: {
        streamsAttended: streams.length,
        attendanceRate: totalAvailableStreams > 0 
          ? (streams.length / totalAvailableStreams) * 100 
          : 0,
        totalWatchTime,
        averageWatchTimePerStream: streams.length > 0 
          ? totalWatchTime / streams.length 
          : 0
      },
      engagement: {
        totalInteractions,
        totalChatMessages,
        totalQuestions,
        averageEngagement: streams.length > 0
          ? streamDetails.reduce((sum, s) => sum + s.engagement, 0) / streams.length
          : 0
      },
      recentStreams: streamDetails.sort((a, b) => b.date - a.date).slice(0, 5)
    };

  } catch (error) {
    console.error('Error calculating student analytics:', error);
    throw error;
  }
}
