//app/api/livestreams/[id]/bandwidth/route.js

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
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Get bandwidth settings and stats
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

    const stream = await LiveStream.findById(id)
      .select('settings.bandwidth statistics.bandwidth')
      .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Get current bandwidth usage
    const bandwidthStats = await calculateBandwidthStats(id);

    return NextResponse.json({
      settings: stream.settings?.bandwidth || getDefaultBandwidthSettings(),
      statistics: {
        ...stream.statistics?.bandwidth,
        current: bandwidthStats
      }
    });

  } catch (error) {
    console.error('Error fetching bandwidth info:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update bandwidth settings
export async function PATCH(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const updates = await req.json();
    await connectDB();

    // Validate and normalize bandwidth settings
    const validSettings = validateBandwidthSettings(updates);

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.bandwidth': validSettings }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Broadcast bandwidth settings update to connected clients
    const ws = await connectWebSocket();
    ws.broadcast(id, {
      type: 'bandwidthSettingsUpdated',
      settings: validSettings
    });

    return NextResponse.json({
      success: true,
      settings: validSettings
    });

  } catch (error) {
    console.error('Error updating bandwidth settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Report bandwidth metrics
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const metrics = await req.json();
    await connectDB();

    // Validate metrics
    if (!validateBandwidthMetrics(metrics)) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Store bandwidth metrics
    await LiveStream.updateOne(
        { _id: id },
        {
          $push: {
            'statistics.bandwidth.metrics': {
              userId: user.id,
              timestamp: new Date(),
              ...metrics
            }
          },
          $max: {
            'statistics.bandwidth.peakBitrate': metrics.bitrate || 0,
            'statistics.bandwidth.peakPacketLoss': metrics.packetLoss || 0
          }
        }
      );
  
      // Check if quality adjustment is needed
      const shouldAdjustQuality = await checkQualityAdjustment(id, metrics);
      if (shouldAdjustQuality) {
        const newQuality = calculateOptimalQuality(metrics);
        
        // Broadcast quality adjustment to affected client
        const ws = await connectWebSocket();
        ws.send(user.id, {
          type: 'qualityAdjustment',
          quality: newQuality
        });
      }
  
      return NextResponse.json({
        success: true,
        qualityAdjustment: shouldAdjustQuality ? newQuality : null
      });
  
    } catch (error) {
      console.error('Error reporting bandwidth metrics:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }
  
  // Helper Functions
  
  function getDefaultBandwidthSettings() {
    return {
      videoBitrate: {
        min: 100,
        max: 4000,
        default: 2000
      },
      audioBitrate: {
        min: 32,
        max: 128,
        default: 64
      },
      qualityLevels: ['auto', '1080p', '720p', '480p', '360p'],
      adaptiveBitrate: true,
      packetLossThreshold: 5,
      bitrateAdjustmentFactor: 0.75,
      minKeyFrameInterval: 2,
      maxKeyFrameInterval: 10
    };
  }
  
  function validateBandwidthSettings(settings) {
    const defaults = getDefaultBandwidthSettings();
    
    return {
      videoBitrate: {
        min: Math.max(100, Math.min(settings.videoBitrate?.min || defaults.videoBitrate.min, 8000)),
        max: Math.max(100, Math.min(settings.videoBitrate?.max || defaults.videoBitrate.max, 8000)),
        default: Math.max(100, Math.min(settings.videoBitrate?.default || defaults.videoBitrate.default, 8000))
      },
      audioBitrate: {
        min: Math.max(16, Math.min(settings.audioBitrate?.min || defaults.audioBitrate.min, 320)),
        max: Math.max(16, Math.min(settings.audioBitrate?.max || defaults.audioBitrate.max, 320)),
        default: Math.max(16, Math.min(settings.audioBitrate?.default || defaults.audioBitrate.default, 320))
      },
      qualityLevels: settings.qualityLevels?.filter(q => 
        defaults.qualityLevels.includes(q)
      ) || defaults.qualityLevels,
      adaptiveBitrate: settings.adaptiveBitrate ?? defaults.adaptiveBitrate,
      packetLossThreshold: Math.max(1, Math.min(settings.packetLossThreshold || defaults.packetLossThreshold, 20)),
      bitrateAdjustmentFactor: Math.max(0.5, Math.min(settings.bitrateAdjustmentFactor || defaults.bitrateAdjustmentFactor, 0.9)),
      minKeyFrameInterval: Math.max(1, Math.min(settings.minKeyFrameInterval || defaults.minKeyFrameInterval, 5)),
      maxKeyFrameInterval: Math.max(5, Math.min(settings.maxKeyFrameInterval || defaults.maxKeyFrameInterval, 20))
    };
  }
  
  function validateBandwidthMetrics(metrics) {
    const requiredFields = ['bitrate', 'packetLoss', 'rtt', 'jitter'];
    const hasRequiredFields = requiredFields.every(field => 
      typeof metrics[field] === 'number' && !isNaN(metrics[field])
    );
  
    if (!hasRequiredFields) return false;
  
    // Validate ranges
    return (
      metrics.bitrate >= 0 &&
      metrics.packetLoss >= 0 && metrics.packetLoss <= 100 &&
      metrics.rtt >= 0 &&
      metrics.jitter >= 0
    );
  }
  
  async function calculateBandwidthStats(streamId) {
    await connectDB();
  
    const stream = await LiveStream.findById(streamId)
      .select('statistics.bandwidth.metrics')
      .lean();
  
    if (!stream?.statistics?.bandwidth?.metrics?.length) {
      return null;
    }
  
    const metrics = stream.statistics.bandwidth.metrics;
    const recentMetrics = metrics.filter(m => 
      new Date(m.timestamp) > new Date(Date.now() - 5 * 60000) // Last 5 minutes
    );
  
    return {
      averageBitrate: recentMetrics.reduce((acc, m) => acc + m.bitrate, 0) / recentMetrics.length,
      averagePacketLoss: recentMetrics.reduce((acc, m) => acc + m.packetLoss, 0) / recentMetrics.length,
      averageRTT: recentMetrics.reduce((acc, m) => acc + m.rtt, 0) / recentMetrics.length,
      averageJitter: recentMetrics.reduce((acc, m) => acc + m.jitter, 0) / recentMetrics.length,
      bitrateVariance: calculateVariance(recentMetrics.map(m => m.bitrate)),
      packetLossSpikes: countSpikes(recentMetrics.map(m => m.packetLoss), 5),
      qualityDrops: calculateQualityDrops(recentMetrics)
    };
  }
  
  async function checkQualityAdjustment(streamId, metrics) {
    await connectDB();
  
    const stream = await LiveStream.findById(streamId)
      .select('settings.bandwidth')
      .lean();
  
    const settings = stream.settings?.bandwidth || getDefaultBandwidthSettings();
  
    // Check if adaptive bitrate is enabled
    if (!settings.adaptiveBitrate) return false;
  
    // Check for conditions requiring quality adjustment
    return (
      metrics.packetLoss > settings.packetLossThreshold ||
      metrics.rtt > 300 || // High latency
      metrics.jitter > 50 || // High jitter
      metrics.bitrate < settings.videoBitrate.min * 0.8 // Bitrate too low
    );
  }
  
  function calculateOptimalQuality(metrics) {
    // Implement quality selection logic based on metrics
    if (metrics.packetLoss > 10 || metrics.rtt > 500) {
      return '360p';
    } else if (metrics.packetLoss > 5 || metrics.rtt > 300) {
      return '480p';
    } else if (metrics.packetLoss > 2 || metrics.rtt > 200) {
      return '720p';
    } else {
      return '1080p';
    }
  }
  
  function calculateVariance(values) {
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  function countSpikes(values, threshold) {
    return values.filter((val, i) => 
      i > 0 && values[i - 1] < threshold && val >= threshold
    ).length;
  }
  
  function calculateQualityDrops(metrics) {
    return metrics.filter((m, i) => 
      i > 0 && 
      metrics[i - 1].bitrate > m.bitrate * 1.5 // 50% drop in bitrate
    ).length;
  }