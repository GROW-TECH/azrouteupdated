import jwt from 'jsonwebtoken';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

export async function getUserFromToken(token) {
  try {
    if (!token) return null;

    await connectDB();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (decoded.role === 'student') {
      user = await Student.findById(decoded.userId).select('-password');
    } else if (decoded.role === 'teacher') {
      user = await Teacher.findById(decoded.userId).select('-password');
    }

    return user;
  } catch (error) {
    console.error('Token decoding failed:', error.message);
    return null;
  }
}
