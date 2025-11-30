// app/api/student/certificates/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Authenticate student using JWT stored in cookies
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from('Students')
      .select('id, student_name as name, email, mobile')
      .eq('id', decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      role: 'student'
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

// GET all completed certificates for the logged-in student
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: enrollments, error } = await supabase
      .from('CourseEnrollments')
      .select(`
        id,
        courseId (
          id, title, category, level, totalDuration,
          teacherId (id, firstName, lastName, department, qualification)
        ),
        completedAt,
        certificate
      `)
      .eq('studentId', user.id)
      .eq('status', 'completed')
      .is('certificate->>issued', true)
      .order('completedAt', { ascending: false });

    if (error) throw error;

    const certificates = enrollments.map(enrollment => ({
      id: enrollment.id,
      courseId: enrollment.courseId.id,
      courseTitle: enrollment.courseId.title,
      category: enrollment.courseId.category,
      level: enrollment.courseId.level,
      completedAt: enrollment.completedAt,
      issuedAt: enrollment.certificate.issuedAt,
      url: enrollment.certificate.url,
      metadata: {
        student: { name: user.name },
        teacher: enrollment.courseId.teacherId
          ? {
              name: `${enrollment.courseId.teacherId.firstName} ${enrollment.courseId.teacherId.lastName}`,
              department: enrollment.courseId.teacherId.department,
              qualification: enrollment.courseId.teacherId.qualification,
            }
          : null,
        courseDuration: enrollment.courseId.totalDuration,
        grade: enrollment.certificate.grade || 'Pass',
        certificateId: enrollment.certificate.id,
      }
    }));

    return NextResponse.json({
      certificates,
      summary: {
        total: certificates.length,
        byCategory: certificates.reduce((acc, cert) => {
          acc[cert.category] = (acc[cert.category] || 0) + 1;
          return acc;
        }, {}),
        byLevel: certificates.reduce((acc, cert) => {
          acc[cert.level] = (acc[cert.level] || 0) + 1;
          return acc;
        }, {}),
      }
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// POST to generate a certificate PDF
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { enrollmentId } = await request.json();

    const { data: enrollment, error } = await supabase
      .from('CourseEnrollments')
      .select(`
        id,
        courseId (
          id, title, category, level, totalDuration,
          teacherId (id, firstName, lastName, department, qualification)
        ),
        completedAt,
        certificate
      `)
      .eq('id', enrollmentId)
      .eq('studentId', user.id)
      .eq('status', 'completed')
      .single();

    if (error || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found or not completed' }, { status: 404 });
    }

    if (enrollment.certificate?.url) {
      return NextResponse.json({
        message: 'Certificate already exists',
        certificateUrl: enrollment.certificate.url
      });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const certificateData = {
      student: { name: user.name },
      course: {
        title: enrollment.courseId.title,
        duration: `${Math.ceil(enrollment.courseId.totalDuration / 60)} hours`,
        category: enrollment.courseId.category,
        level: enrollment.courseId.level
      },
      teacher: enrollment.courseId.teacherId
        ? {
            name: `${enrollment.courseId.teacherId.firstName} ${enrollment.courseId.teacherId.lastName}`,
            department: enrollment.courseId.teacherId.department,
            qualification: enrollment.courseId.teacherId.qualification
          }
        : null,
      completionDate: enrollment.completedAt,
      certificateId
    };

    const pdfBuffer = await generateCertificatePDF(certificateData);

    // TODO: Upload PDF to Supabase Storage and get URL
    const certificateUrl = await uploadCertificatePDF(pdfBuffer, `certificates/${user.id}/${certificateId}.pdf`);

    // Update enrollment with certificate info
    const { error: updateError } = await supabase
      .from('CourseEnrollments')
      .update({
        certificate: {
          issued: true,
          issuedAt: new Date(),
          url: certificateUrl,
          id: certificateId
        }
      })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Certificate generated successfully',
      certificate: {
        id: certificateId,
        url: certificateUrl,
        issuedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}

// ---------------- PDF helpers ----------------
async function generateCertificatePDF(data) {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
  const fonts = await loadCustomFonts();

  doc.font(fonts.title).fontSize(40).text('Certificate of Completion', { align: 'center' });
  doc.moveDown().font(fonts.body).fontSize(24).text('This is to certify that', { align: 'center' });
  doc.moveDown().font(fonts.name).fontSize(32).text(data.student.name, { align: 'center' });
  doc.moveDown().font(fonts.body).fontSize(24).text('has successfully completed the course', { align: 'center' });
  doc.moveDown().font(fonts.courseName).fontSize(28).text(data.course.title, { align: 'center' });
  doc.moveDown().font(fonts.details).fontSize(16)
    .text(`Course Duration: ${data.course.duration}`, { align: 'center' })
    .text(`Completed on: ${new Date(data.completionDate).toLocaleDateString()}`, { align: 'center' });

  if (data.teacher) {
    doc.moveDown()
      .text(`Instructor: ${data.teacher.name}`, { align: 'center' })
      .text(`Department: ${data.teacher.department}`, { align: 'center' })
      .text(`Qualification: ${data.teacher.qualification}`, { align: 'center' });
  }

  doc.moveDown().text(`Certificate ID: ${data.certificateId}`, { align: 'center' });

  await addCertificateElements(doc, { instructorSignature: true, platformLogo: true, verificationQR: true });

  return new Promise((resolve) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
}

async function uploadCertificatePDF(buffer, path) {
  // Implement Supabase Storage upload here
  return null;
}

async function loadCustomFonts() {
  return {
    title: 'fonts/certificate-title.ttf',
    body: 'fonts/certificate-body.ttf',
    name: 'fonts/certificate-name.ttf',
    courseName: 'fonts/certificate-course.ttf',
    details: 'fonts/certificate-details.ttf'
  };
}

async function addCertificateElements(doc, options) {
  // Optional: add signatures, logos, QR codes
}
