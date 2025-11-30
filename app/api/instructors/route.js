import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'rating';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const subjectFilter = searchParams.get('subject');

    await connectDB();

    // Build query
    let query = { role: 'teacher' };
    
    // Department filter
    if (department) {
      query.department = { $regex: new RegExp(department, 'i') };
    }
    
    // Subject filter
    if (subjectFilter) {
      query.subjectsToTeach = { $regex: new RegExp(subjectFilter, 'i') };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } },
        { experience: { $regex: search, $options: 'i' } }
      ];
    }

    // Aggregate pipeline for teacher statistics
    const aggregatePipeline = [
      { $match: query },
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
          totalStudents: {
            $reduce: {
              input: '$courses',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.enrolledStudents'] }
            }
          },
          averageRating: {
            $avg: '$courses.rating'
          }
        }
      }
    ];

    // Add sort stage based on sort parameter
    let sortStage = {};
    switch (sort) {
      case 'students':
        sortStage = { totalStudents: -1 };
        break;
      case 'courses':
        sortStage = { coursesCount: -1 };
        break;
      case 'rating':
        sortStage = { averageRating: -1 };
        break;
      case 'name':
        sortStage = { firstName: 1, lastName: 1 };
        break;
      default:
        sortStage = { averageRating: -1 };
    }
    
    aggregatePipeline.push({ $sort: sortStage });

    // Add pagination stages
    aggregatePipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          profileImage: 1,
          department: 1,
          qualification: 1,
          experience: 1,
          subjectsToTeach: 1,
          bio: 1,
          coursesCount: 1,
          totalStudents: 1,
          averageRating: 1,
          stats: 1,
          createdAt: 1
        }
      }
    );

    // Execute queries
    const [teachers, totalCount] = await Promise.all([
      Teacher.aggregate(aggregatePipeline),
      Teacher.countDocuments(query)
    ]);

    // Transform the data
    const transformedTeachers = teachers.map(teacher => ({
      id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      avatar: teacher.profileImage,
      department: teacher.department,
      qualification: teacher.qualification,
      experience: teacher.experience,
      subjects: teacher.subjectsToTeach,
      bio: teacher.bio,
      stats: {
        coursesCount: teacher.coursesCount || 0,
        totalStudents: teacher.totalStudents || 0,
        averageRating: teacher.averageRating ? Number(teacher.averageRating.toFixed(1)) : 0,
        ...teacher.stats
      },
      createdAt: teacher.createdAt
    }));

    return Response.json({
      teachers: transformedTeachers,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasMore: page < Math.ceil(totalCount / limit)
    });
    
  } catch (error) {
    console.error('Teachers fetch error:', error);
    return Response.json(
      { message: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
