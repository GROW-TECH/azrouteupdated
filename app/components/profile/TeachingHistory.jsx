// components/profile/TeachingHistory.jsx
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "../ui/card";
  import { Progress } from "../ui/progress";
  import {
    Users,
    Star,
    BookOpen,
    Award,
  } from "lucide-react";
  
  export function TeachingHistory({ user }) {
    const stats = {
      totalStudents: 1234,
      averageRating: 4.8,
      coursesCreated: 15,
      totalReviews: 256,
    };
  
    const courses = [
      {
        id: 1,
        title: "Advanced Web Development",
        students: 256,
        rating: 4.9,
        completionRate: 85,
        reviews: 48,
      },
      {
        id: 2,
        title: "React Masterclass",
        students: 189,
        rating: 4.7,
        completionRate: 78,
        reviews: 35,
      },
    ];
  
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Courses Created
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coursesCreated}</div>
              <p className="text-xs text-muted-foreground">
                2 in development
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Achievement Level
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Expert</div>
              <p className="text-xs text-muted-foreground">
                Top 10% of teachers
              </p>
            </CardContent>
          </Card>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>
              Overview of your course statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {courses.map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{course.title}</h4>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Students:</span>{" "}
                      {course.students}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviews:</span>{" "}
                      {course.reviews}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completion:</span>{" "}
                      {course.completionRate}%
                    </div>
                  </div>
                  <Progress value={course.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }