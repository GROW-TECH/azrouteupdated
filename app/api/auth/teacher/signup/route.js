// app/api/auth/teacher/signup/route.js
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const SPECIAL_CHARS = '!@#$%^&*(),.?{}';

export async function POST(request) {
  try {
    await connectDB();
    const { 
      firstName, 
      middleName, 
      lastName, 
      email, 
      password, 
      phoneNumber,
      qualification,
      experience
    } = await request.json();

    // Input validation
    if (!firstName || !lastName || !email || !password || !phoneNumber || 
        !qualification || !experience ) {
      return Response.json(
        { message: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate password requirements
    const passwordValidation = {
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: new RegExp(`[${SPECIAL_CHARS}]`).test(password)
    };

    if (!Object.values(passwordValidation).every(Boolean)) {
      return Response.json(
        { 
          message: "Password must be at least 10 characters long and atleast one uppercase letter, one lowercase letter, and one special character" 
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingTeacher = await Teacher.findOne({ email: email.toLowerCase() });
    if (existingTeacher) {
      return Response.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }


    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new teacher
    const teacher = new Teacher({
      firstName: firstName.trim(),
      middleName: middleName?.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phoneNumber: phoneNumber.trim(),
      qualification: qualification.trim(),
      experience: experience.trim(),
      verificationToken,
      verificationTokenExpires,
      verified: false
    });

    await teacher.save();

    // Send verification email
    await sendVerificationEmail({
      email: teacher.email,
      token: verificationToken,
      name: `${teacher.firstName} ${teacher.lastName}`,
      role: 'teacher'
    });

    return Response.json({
      message: "Registration successful! Please check your email to verify your account."
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error.message === 'Failed to send verification email') {
      return Response.json(
        { message: "Account created but failed to send verification email. Please contact support." },
        { status: 500 }
      );
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json(
        { message: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
