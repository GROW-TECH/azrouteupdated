import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import Teacher from '@/models/Teacher';

// Helper function to format teacher data
function formatTeacherData(teacher) {
  if (!teacher) return null;
  return {
    id: teacher._id,
    name: `${teacher.firstName} ${teacher.lastName}`,
    email: teacher.email,
    phoneNumber: teacher.phoneNumber,
    department: teacher.department,
    qualification: teacher.qualification,
    experience: teacher.experience,
    subjectsToTeach: teacher.subjectsToTeach,
    profileImage: teacher.profileImage,
    bio: teacher.bio,
    stats: teacher.stats
  };
}

// Helper function to format course data
function formatCourseData(course, teacherData) {
  if (!course) return null;
  return {
    id: course._id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    price: course.price,
    discountedPrice: course.discountedPrice,
    level: course.level,
    category: course.category,
    rating: course.rating,
    totalRatings: course.totalRatings,
    enrolledStudents: course.enrolledStudents,
    totalDuration: course.totalDuration,
    totalLessons: course.totalLessons,
    featured: course.featured,
    teacher: teacherData,
    lastUpdated: course.lastUpdated,
    language: course.language,
    requirements: course.requirements,
    objectives: course.objectives,
    tags: course.tags,
    status: course.status
  };
}

// Helper function to format event data
function formatEventData(event, teacherData, registrationCount = 0) {
  if (!event) return null;
  return {
    id: event._id,
    title: event.title,
    description: event.description,
    thumbnail: event.thumbnail,
    type: event.type,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate,
    timeZone: event.timeZone,
    location: event.location,
    capacity: event.capacity,
    featured: event.featured,
    registrationCount,
    maximumRegistrations: event.maximumRegistrations,
    currentRegistrations: event.currentRegistrations,
    ticketTiers: event.ticketTiers,
    teacher: teacherData,
    agenda: event.agenda,
    speakers: event.speakers,
    prerequisites: event.prerequisites,
    resources: event.resources,
    status: event.status,
    registrationDeadline: event.registrationDeadline,
    isRefundable: event.isRefundable,
    refundPolicy: event.refundPolicy,
    certificateProvided: event.certificateProvided
  };
}

// Helper function to build course query
function buildCourseQuery(filters) {
  const query = { status: 'published' };

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  if (filters.level && filters.level !== 'all') {
    query.level = filters.level;
  }

  return query;
}

// Helper function to build event query
function buildEventQuery(filters) {
  const query = { status: 'published' };
  const now = new Date();

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  if (filters.eventType && filters.eventType !== 'all') {
    query.type = filters.eventType;
  }

  switch (filters.timeframe) {
    case 'upcoming':
      query.startDate = { $gt: now };
      break;
    case 'past':
      query.endDate = { $lt: now };
      break;
    // Default to showing all events if no timeframe specified
  }

  return query;
}

// Helper function to get sort options
function getSortOptions(sortType, contentType) {
  if (contentType === 'courses') {
    switch (sortType) {
      case 'newest':
        return { createdAt: -1 };
      case 'price-low':
        return { price: 1 };
      case 'price-high':
        return { price: -1 };
      case 'rating':
        return { rating: -1 };
      case 'popular':
      default:
        return { enrolledStudents: -1 };
    }
  } else {
    switch (sortType) {
      case 'newest':
        return { createdAt: -1 };
      case 'startDate':
        return { startDate: 1 };
      case 'popular':
        return { currentRegistrations: -1 };
      default:
        return { startDate: 1 };
    }
  }
}

// Helper function to fetch teacher data
async function fetchTeacherData(teacherIds) {
  try {
    const objectIds = [...new Set(teacherIds)].map(id => 
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );

    const teachers = await Teacher.find({
      _id: { $in: objectIds }
    }).select(
      'firstName lastName email phoneNumber department qualification experience subjectsToTeach profileImage bio stats'
    ).lean();

    const teacherMap = new Map();
    teachers.forEach(teacher => {
      teacherMap.set(teacher._id.toString(), formatTeacherData(teacher));
    });

    return teacherMap;
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const type = searchParams.get('type') || 'courses';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const filters = {
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      level: searchParams.get('level'),
      eventType: searchParams.get('eventType'),
      timeframe: searchParams.get('timeframe'),
      sort: searchParams.get('sort') || (type === 'courses' ? 'popular' : 'startDate')
    };

    await connectDB();

    if (type === 'courses') {
      const query = buildCourseQuery(filters);
      const sortOptions = getSortOptions(filters.sort, 'courses');

      const [courses, totalCount] = await Promise.all([
        Course.find(query)
          .select('-__v')
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Course.countDocuments(query)
      ]);

      const teacherIds = [...new Set(courses
        .map(course => course.teacherId)
        .filter(id => id != null))];

      const teacherMap = await fetchTeacherData(teacherIds);

      const formattedCourses = courses.map(course => {
        const teacherData = course.teacherId 
          ? teacherMap.get(course.teacherId.toString())
          : null;
        return formatCourseData(course, teacherData);
      });

      return NextResponse.json({
        items: formattedCourses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount
        }
      });

    } else {
      const query = buildEventQuery(filters);
      const sortOptions = getSortOptions(filters.sort, 'events');
      console.log("query",query)
      const [events, totalCount] = await Promise.all([
        Event.find(query)
          // .select('-__v')
          // .sort(sortOptions)
          // .skip((page - 1) * limit)
          // .limit(limit)
          // .lean(),
        ,Event.countDocuments(query)
      ]);
      console.log("events",events)
      const teacherIds = [...new Set(events
        .map(event => event.teacherId)
        .filter(id => id != null))];

      const teacherMap = await fetchTeacherData(teacherIds);

      const eventIds = events.map(event => event._id);
      const registrationCounts = await Registration.aggregate([
        {
          $match: {
            eventId: { $in: eventIds },
            status: { $in: ['confirmed', 'attended'] }
          }
        },
        {
          $group: {
            _id: '$eventId',
            count: { $sum: 1 }
          }
        }
      ]);

      const registrationCountMap = new Map(
        registrationCounts.map(item => [item._id.toString(), item.count])
      );

      const formattedEvents = events.map(event => {
        const teacherData = event.teacherId 
          ? teacherMap.get(event.teacherId.toString())
          : null;
        return formatEventData(
          event, 
          teacherData,
          registrationCountMap.get(event._id.toString()) || 0
        );
      });
      console.log("formattedEvents",formattedEvents)
      return NextResponse.json({
        items: formattedEvents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount
        }
      });
    }

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
