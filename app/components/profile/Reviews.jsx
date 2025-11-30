// components/profile/Reviews.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Star, GraduationCap } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";


const reviews = [
  {
    id: 1,
    rating: 5,
    content: "Excellent teaching style! Very clear explanations and helpful with questions.",
    student: {
      id: "s1",
      firstName: "Alex",
      lastName: "Chen",
      email: "alex.chen@example.com",
      profileImage: "/placeholders/student-1.jpg",
      department: "Computer Science"
    },
    course: {
      id: "c1",
      title: "Advanced Web Development",
      teacher: {
        id: "t1",
        firstName: "Sarah",
        lastName: "Johnson",
        department: "Computer Science",
        qualification: "Ph.D. in Computer Science"
      }
    },
    createdAt: "2024-10-25",
    verifiedEnrollment: true
  },
  {
    id: 2,
    rating: 4,
    content: "Great course content and structure. Would recommend to other students.",
    student: {
      id: "s2",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@example.com",
      profileImage: "/placeholders/student-2.jpg",
      department: "Design"
    },
    course: {
      id: "c2",
      title: "UI/UX Design Fundamentals",
      teacher: {
        id: "t2",
        firstName: "Michael",
        lastName: "Chen",
        department: "Design",
        qualification: "Master's in Interactive Design"
      }
    },
    createdAt: "2024-10-20",
    verifiedEnrollment: true
  },
  {
    id: 3,
    rating: 5,
    content: "Incredibly knowledgeable instructor with real-world examples.",
    student: {
      id: "s3",
      firstName: "Michael",
      lastName: "Brown",
      email: "m.brown@example.com",
      profileImage: "/placeholders/student-3.jpg",
      department: "Computer Science"
    },
    course: {
      id: "c3",
      title: "Data Structures & Algorithms",
      teacher: {
        id: "t3",
        firstName: "Alex",
        lastName: "Turner",
        department: "Computer Science",
        qualification: "Ph.D. in Computer Science"
      }
    },
    createdAt: "2024-10-15",
    verifiedEnrollment: true
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function Reviews() {
  const averageRating = (
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Reviews</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              {averageRating}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{averageRating}</div>
            <div className="space-y-1">
              <StarRating rating={Number(averageRating)} />
              <p className="text-sm text-muted-foreground">
                Based on {reviews.length} reviews
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={review.student.profileImage} />
                      <AvatarFallback>
                        {review.student.firstName[0]}
                        {review.student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {`${review.student.firstName} ${review.student.lastName}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {review.course.title}
                        </p>
                        {review.student.department && (
                          <Badge variant="secondary" className="text-xs">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {review.student.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Reviewed on {new Date(review.createdAt).toLocaleDateString()}</p>
                    <p>Course by: {`${review.course.teacher.firstName} ${review.course.teacher.lastName}`}</p>
                  </div>
                  {review.verifiedEnrollment && (
                    <Badge variant="outline">Verified Student</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center">
        <Button variant="outline">Load More Reviews</Button>
      </div>
    </div>
  );
}