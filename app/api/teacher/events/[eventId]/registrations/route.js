// app/api/teacher/events/[eventId]/registrations/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import Registration from '@/models/EventRegistration';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and teacher role
    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify event ownership
    const event = await Event.findOne({
      _id: eventId,
      teacherId: decoded.userId
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get registrations with user details
    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email profile')
      .sort({ registeredAt: -1 })
      .lean();

    // Format registrations to include all necessary details
    const formattedRegistrations = registrations.map(reg => ({
      id: reg._id,
      student: {
        id: reg.studentId?._id,
        name: reg.studentId?.name || 'Unknown',
        email: reg.studentId?.email || 'Unknown',
        profile: reg.studentId?.profile
      },
      ticketTier: reg.ticketTier ? {
        id: reg.ticketTier._id || reg.ticketTier.id,
        name: reg.ticketTier.name || '',
        price: reg.ticketTier.price || 0
      } : null,
      status: reg.status || 'pending',
      registeredAt: reg.registeredAt,
      attendedAt: reg.attendedAt,
      payment: {
        status: reg.paymentStatus || 'pending',
        id: reg.paymentId,
        info: reg.paymentInfo || {}
      },
      refund: reg.status === 'refunded' ? {
        id: reg.refundId,
        refundedAt: reg.refundedAt
      } : null,
      attendance: {
        status: reg.attendanceStatus || 'registered',
        checkinTime: reg.checkinTime,
        checkoutTime: reg.checkoutTime
      },
      certificate: {
        issued: reg.certificateIssued || false,
        url: reg.certificateUrl
      },
      feedback: reg.feedback || null,
      additionalInfo: reg.additionalInfo || {}
    }));

    // Calculate statistics
    const statistics = {
        total: formattedRegistrations.length,
        confirmed: formattedRegistrations.filter(reg => reg.status === 'confirmed').length,
        pending: formattedRegistrations.filter(reg => reg.status === 'pending').length,
        cancelled: formattedRegistrations.filter(reg => reg.status === 'cancelled').length,
        refunded: formattedRegistrations.filter(reg => reg.status === 'refunded').length,
        attended: formattedRegistrations.filter(reg => reg.attendance.status === 'attended').length,
        totalRevenue: formattedRegistrations
          .filter(reg => reg.payment.status === 'completed')
          .reduce((sum, reg) => sum + reg.ticketTier.price, 0)
      }
    
    // Return only the formatted registrations array
    return NextResponse.json(formattedRegistrations);

  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Export registrations to CSV
export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify event ownership
    const event = await Event.findOne({
      _id: eventId,
      teacherId: decoded.userId
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get registrations with user details
    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email profile')
      .sort({ registeredAt: -1 })
      .lean();

    // Convert to CSV with additional fields
    const rows = registrations.map(reg => ({
      'Attendee Name': reg.studentId?.name || 'Unknown',
      'Email': reg.studentId?.email || 'Unknown',
      'Ticket Type': reg.ticketTier?.name || 'N/A',
      'Price': reg.ticketTier?.price || 0,
      'Registration Status': reg.status || 'pending',
      'Registration Date': reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A',
      'Payment Status': reg.paymentStatus || 'pending',
      'Payment Method': reg.paymentInfo?.paymentMethod || 'N/A',
      'Payment Date': reg.paymentInfo?.paymentDate ? new Date(reg.paymentInfo.paymentDate).toLocaleDateString() : 'N/A',
      'Attendance Status': reg.attendanceStatus || 'registered',
      'Check-in Time': reg.checkinTime ? new Date(reg.checkinTime).toLocaleString() : 'N/A',
      'Check-out Time': reg.checkoutTime ? new Date(reg.checkoutTime).toLocaleString() : 'N/A',
      'Certificate Issued': reg.certificateIssued ? 'Yes' : 'No',
      'Feedback Rating': reg.feedback?.rating || 'N/A',
      'Feedback Comment': reg.feedback?.comment || 'N/A',
      'Dietary Requirements': reg.additionalInfo?.dietary || 'N/A',
      'Special Requirements': reg.additionalInfo?.specialRequirements || 'N/A'
    }));

    // Create CSV content
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${event.title}-registrations.csv`
      }
    });

  } catch (error) {
    console.error('Error exporting registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}