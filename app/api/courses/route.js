import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Teacher from "@/models/Teacher";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const teacher = searchParams.get('teacher');

    await connectDB();

    // Build query
    let query = {};
    
    // Domain filter
    if (domain) {
      query.domain = { $regex: new RegExp(domain, 'i') };
    }
    
    // Level filter
    if (level) {
      query.level = level;
    }
    
    // Teacher filter
    if (teacher && teacher !== 'all') {
      query.teacherId = teacher;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'teacherName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'price-asc':
        sortQuery.price = 1;
        break;
      case 'price-desc':
        sortQuery.price = -1;
        break;
      case 'rating':
        sortQuery.averageRating = -1;
        sortQuery.totalReviews = -1;
        break;
      case 'popular':
        sortQuery.enrolledStudents = -1;
        break;
      default:
        sortQuery.createdAt = -1;
    }

    // Execute queries
    const [total, courses] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('teacherId', 'firstName lastName email phoneNumber department qualification experience subjectsToTeach bio profileImage stats')
    ]);

    // Transform the data to include teacher information
    const transformedCourses = courses.map(course => {
      const courseObj = course.toObject();
      const teacher = courseObj.teacherId;
      
      return {
        ...courseObj,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : courseObj.teacherName,
        teacherAvatar: teacher?.profileImage,
        teacherSpecialty: teacher?.department,
        teacher: teacher ? {
          id: teacher._id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          phoneNumber: teacher.phoneNumber,
          department: teacher.department,
          qualification: teacher.qualification,
          experience: teacher.experience,
          subjectsToTeach: teacher.subjectsToTeach,
          bio: teacher.bio,
          profileImage: teacher.profileImage,
          stats: {
            totalStudents: teacher.stats.totalStudents,
            activeCourses: teacher.stats.activeCourses,
            completionRate: teacher.stats.completionRate
          }
        } : null
      };
    });

    return Response.json({
      courses: transformedCourses,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: page < Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Courses fetch error:', error);
    return Response.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// Helper function to get featured teachers for a domain
export async function getFeaturedTeachers(domain) {
  try {
    const teachers = await Teacher.aggregate([
      {
        $match: {
          verified: true,
          subjectsToTeach: { $regex: new RegExp(domain, 'i') }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'teacherId',
          as: 'courses'
        }
      },
      {
        $addFields: {
          coursesCount: { $size: '$courses' },
          totalStudents: '$stats.totalStudents',
          completionRate: '$stats.completionRate'
        }
      },
      {
        $sort: {
          totalStudents: -1,
          completionRate: -1
        }
      },
      {
        $limit: 4
      },
      {
        $project: {
          _id: 1,
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          profileImage: 1,
          department: 1,
          qualification: 1,
          experience: 1,
          bio: 1,
          coursesCount: 1,
          stats: 1
        }
      }
    ]);

    return teachers;
  } catch (error) {
    console.error('Featured teachers fetch error:', error);
    throw error;
  }
}
