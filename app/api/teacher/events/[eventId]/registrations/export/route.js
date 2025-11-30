// app/api/teacher/events/[eventId]/registrations/export/route.js
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

    // Get registrations with student details
    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email profile')
      .sort({ registeredAt: -1 })
      .lean();

    // Format data for CSV
    const rows = registrations.map(reg => ({
      'Registration ID': reg._id.toString(),
      'Registration Date': reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A',
      'Student Name': reg.studentId?.name || 'Unknown',
      'Student Email': reg.studentId?.email || 'Unknown',
      'Ticket Type': reg.ticketTier?.name || 'N/A',
      'Price': `$${reg.ticketTier?.price || 0}`,
      'Registration Status': reg.status || 'pending',
      'Payment Status': reg.paymentStatus || 'pending',
      'Payment Method': reg.paymentInfo?.paymentMethod || 'N/A',
      'Transaction ID': reg.paymentInfo?.transactionId || 'N/A',
      'Payment Date': reg.paymentInfo?.paymentDate ? new Date(reg.paymentInfo.paymentDate).toLocaleDateString() : 'N/A',
      'Attendance Status': reg.attendanceStatus || 'registered',
      'Check-in Time': reg.checkinTime ? new Date(reg.checkinTime).toLocaleString() : 'N/A',
      'Check-out Time': reg.checkoutTime ? new Date(reg.checkoutTime).toLocaleString() : 'N/A',
      'Certificate Issued': reg.certificateIssued ? 'Yes' : 'No',
      'Certificate URL': reg.certificateUrl || 'N/A',
      'Feedback Rating': reg.feedback?.rating || 'N/A',
      'Feedback Comment': reg.feedback?.comment ? `"${reg.feedback.comment}"` : 'N/A',
      'Dietary Requirements': reg.additionalInfo?.dietary ? `"${reg.additionalInfo.dietary}"` : 'N/A',
      'Special Requirements': reg.additionalInfo?.specialRequirements ? `"${reg.additionalInfo.specialRequirements}"` : 'N/A',
      'Questions & Answers': reg.additionalInfo?.questions?.map(q => 
        `${q.question}: ${q.answer}`
      ).join('; ') || 'N/A'
    }));

    // Add summary row at the end
    rows.push({});  // Empty row as separator
    rows.push({
      'Registration ID': 'SUMMARY',
      'Total Registrations': registrations.length,
      'Confirmed Registrations': registrations.filter(r => r.status === 'confirmed').length,
      'Pending Registrations': registrations.filter(r => r.status === 'pending').length,
      'Cancelled Registrations': registrations.filter(r => r.status === 'cancelled').length,
      'Total Revenue': `$${registrations.reduce((sum, r) => sum + (r.ticketTier?.price || 0), 0)}`,
      'Attended': registrations.filter(r => r.attendanceStatus === 'attended').length,
      'No-Shows': registrations.filter(r => r.attendanceStatus === 'no-show').length
    });

    // Create CSV content
    const headers = Object.keys(rows[0]);
    const csvRows = [
      // Add event information at the top
      `"Event: ${event.title}"`,
      `"Date: ${new Date(event.startDate).toLocaleDateString()}"`,
      `"Location: ${event.location.type === 'online' ? 'Online Event' : `${event.location.venue}, ${event.location.city}`}"`,
      '', // Empty row as separator
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special characters and formatting
          if (value === undefined || value === null) return 'N/A';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    // Generate filename
    const safeName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${safeName}-registrations-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}