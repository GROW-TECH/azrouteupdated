// components/courses/CourseGrid.jsx
import { CourseCard } from "./CourseCard";
import { CourseListItem } from "./CourseListItem";

// Sample course data with updated teacher model
const sampleCourses = [
  {
    id: 1,
    title: "Advanced Web Development",
    description: "Learn modern web development techniques with React, Node.js, and more.",
    thumbnail: "/api/placeholder/400/300",
    level: "Intermediate",
    category: "Development",
    rating: 4.8,
    studentsEnrolled: 1234,
    duration: "20 hours",
    lessons: 42,
    price: 99.99,
    teacher: {
      id: "t1",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      department: "Computer Science",
      qualification: "Ph.D. in Computer Science",
      experience: "10+ years in Web Development",
      profileImage: "/api/placeholder/40/40",
      subjects: ["Web Development", "JavaScript", "React"]
    }
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    description: "Master the principles of user interface and user experience design.",
    thumbnail: "/api/placeholder/400/300",
    level: "Beginner",
    category: "Design",
    rating: 4.6,
    studentsEnrolled: 856,
    duration: "15 hours",
    lessons: 35,
    price: 79.99,
    teacher: {
      id: "t2",
      firstName: "Michael",
      lastName: "Chen",
      email: "michael.chen@example.com",
      department: "Design",
      qualification: "Master's in Interactive Design",
      experience: "8 years in UX Design",
      profileImage: "/api/placeholder/40/40",
      subjects: ["UI Design", "UX Design", "Design Systems"]
    }
  },
  {
    id: 3,
    title: "Data Science Essentials",
    description: "Introduction to data analysis, machine learning, and statistics.",
    thumbnail: "/api/placeholder/400/300",
    level: "Intermediate",
    category: "Data Science",
    rating: 4.7,
    studentsEnrolled: 1567,
    duration: "25 hours",
    lessons: 48,
    price: 129.99,
    teacher: {
      id: "t3",
      firstName: "Alex",
      lastName: "Turner",
      email: "alex.turner@example.com",
      department: "Data Science",
      qualification: "Ph.D. in Statistics",
      experience: "12 years in Data Science",
      profileImage: "/api/placeholder/40/40",
      subjects: ["Data Analysis", "Machine Learning", "Statistics"]
    }
  }
];

export function CourseGrid({ courses = sampleCourses, view = 'grid', userType = 'student' }) {
  // Loading state
  if (!courses) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-[400px] rounded-lg border-2 border-dashed border-gray-200 p-6 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  // Format courses to ensure consistent structure
  const formattedCourses = courses.map(course => ({
    ...course,
    // Handle both old and new data structures
    teacher: course.teacher || {
      id: course.instructor?.id,
      firstName: course.instructor?.name?.split(' ')[0] || '',
      lastName: course.instructor?.name?.split(' ').slice(1).join(' ') || '',
      profileImage: course.instructor?.avatar,
      department: course.instructor?.role
    }
  }));

  // List view
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {formattedCourses.map((course) => (
          <CourseListItem
            key={course.id}
            course={course}
            userType={userType}
          />
        ))}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className={
      view === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-4"
    }>
      {formattedCourses.map((course) => (
        view === 'grid' ? (
          <CourseCard key={course.id} course={course} />
        ) : (
          <CourseListItem key={course.id} course={course} />
        )
      ))}
    </div>
  );
}