'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  PlayCircle,
  Clock,
  Users,
  Award,
  CheckCircle,
  Star,
  BookOpen,
  BarChart,
  GraduationCap,
  PlaySquare,
  FileText,
  Lock,
  Globe,
  AlertCircle,
  Loader2
} from "lucide-react";
import { use } from 'react';

function CourseSyllabus({ sections }) {
  const [expandedItems, setExpandedItems] = useState([]);
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const totalDuration = sections.reduce((sum, section) => 
    sum + section.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.duration, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
        <span>{totalLessons} lessons</span>
        <span>{Math.ceil(totalDuration / 60)} total hours</span>
      </div>
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={setExpandedItems}
        className="space-y-2"
      >
        {sections.map((section, index) => (
          <AccordionItem
            key={index}
            value={`section-${index}`}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{section.title}</div>
                  <Badge variant="outline">
                    {section.lessons.length} lessons
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.ceil(section.lessons.reduce((sum, lesson) => sum + lesson.duration, 0) / 60)} min
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-muted/30">
              <div className="divide-y">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lessonIndex}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {lesson.preview ? (
                        <PlaySquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        {lesson.description && (
                          <div className="text-sm text-muted-foreground">
                            {lesson.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.ceil(lesson.duration / 60)} min
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function TeacherCard({ teacher }) {
  if (!teacher) return null;

  const {
    firstName = '',
    lastName = '',
    profileImage = '/placeholder-avatar.jpg',
    department = '',
    qualification = '',
    experience = '',
    bio = '',
    stats = {}
  } = teacher;

  const teacherName = `${firstName} ${lastName}`;

  return (
    <div className="flex gap-4 items-start">
      <img
        src={profileImage}
        alt={teacherName}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div>
        <h3 className="font-semibold text-lg">{teacherName}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <GraduationCap className="h-4 w-4 mr-1" />
            {department}
          </Badge>
          {qualification && (
            <Badge variant="outline">{qualification}</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {stats.rating || 0} Teacher Rating
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {stats.totalStudents || 0} Students
          </div>
          <div className="flex items-center gap-1">
            <PlayCircle className="h-4 w-4" />
            {stats.coursesCount || 0} Courses
          </div>
        </div>
        {experience && (
          <div className="mt-2 text-sm text-muted-foreground">
            {experience}
          </div>
        )}
        <p className="mt-4 text-sm line-clamp-4">{bio}</p>
      </div>
    </div>
  );
}

function ReviewSection({ reviews, rating, totalReviews }) {
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-8">
        <div className="text-center">
          <div className="text-5xl font-bold">{rating.toFixed(1)}</div>
          <div className="flex items-center justify-center mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Course Rating • {totalReviews} reviews
          </div>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className="flex items-center gap-2">
              <div className="text-sm w-2">{stars}</div>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Progress
                value={(ratingDistribution[stars] / totalReviews) * 100}
                className="h-2"
              />
              <div className="text-sm text-muted-foreground w-8">
                {((ratingDistribution[stars] / totalReviews) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={review.studentAvatar || '/placeholder-avatar.jpg'}
                alt={review.studentName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="font-medium">{review.studentName}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CourseDetails({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [userEnrollment, setUserEnrollment] = useState(null);
  const {courseId}=use(params)
  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/details`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setCourse(data.course);
      setUserEnrollment(data.userEnrollment);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      // If the course is free, enroll directly
      if (course.price === 0) {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        toast({
          title: 'Success',
          description: 'Successfully enrolled in the course',
        });

        // Redirect to learning page
        router.push(`/learn/${courseId}`);
      } else {
        // For paid courses, redirect to checkout
        router.push(`/checkout/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/courses')}>
          Browse Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-lg text-muted-foreground">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="text-sm">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    {course.category}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <BarChart className="h-4 w-4 mr-1" />
                    {course.level}
                  </Badge>
                  {course.teacher?.department && (
                    <Badge variant="secondary" className="text-sm">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {course.teacher.department}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.enrolledStudents} students
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {course.rating.toFixed(1)} ({course.totalRatings} ratings)
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.ceil(course.totalDuration / 60)} hours
                  </div>
                </div>
                {course.teacher && (
                  <div className="flex items-center gap-2">
                    <img
                      src={course.teacher.profileImage}
                      alt={`${course.teacher.firstName} ${course.teacher.lastName}`}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">
                        {`${course.teacher.firstName} ${course.teacher.lastName}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.teacher.qualification}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">
                    Last updated {new Date(course.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
              <Card className="sticky top-4">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  {course.previewVideo ? (
                    <video
                      src={course.previewVideo}
                      poster={course.thumbnail}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <div className="text-3xl font-bold">
                      {course.price === 0 ? 'Free' : `£${course.price}`}
                    </div>
                    {course.discountedPrice && (
                      <div className="flex items-center gap-2">
                      <span className="text-lg text-muted-foreground line-through">
                        £{course.discountedPrice}
                      </span>
                      <Badge variant="secondary">
                        {Math.round(((course.price - course.discountedPrice) / course.price) * 100)}% off
                      </Badge>
                    </div>
                  )}
                </div>
                {userEnrollment ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Course Progress</span>
                      <span>{Math.round(userEnrollment.progress)}%</span>
                    </div>
                    <Progress value={userEnrollment.progress} className="h-2" />
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/learn/${courseId}`)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {course.price === 0 ? 'Enrolling...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          {course.price === 0 ? 'Enroll Now' : 'Buy Now'}
                        </>
                      )}
                    </Button>
                    {course.moneyBackGuarantee && (
                      <div className="text-center text-sm text-muted-foreground">
                        30-day money-back guarantee
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">This course includes:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <PlayCircle className="h-4 w-4" />
                      {Math.ceil(course.totalDuration / 60)} hours on-demand video
                    </li>
                    {course.resources?.length > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        {course.resources.length} downloadable resources
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      Full lifetime access
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4" />
                      Certificate of completion
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

    {/* Course Content */}
    <div className="container mx-auto px-4 py-12">
      <Tabs defaultValue="overview" className="space-y-8">
      <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  What you'll learn
                </h3>
                <div className="grid gap-2">
                  {course.objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
              </div>

              {course.requirements?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {course.requirements.map((req, index) => (
                      <li key={index} className="text-muted-foreground">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Course Description
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    {course.description}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {course.whoShouldTake && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Who this course is for
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {course.whoShouldTake.map((item, index) => (
                      <li key={index} className="text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="curriculum">
            <CourseSyllabus sections={course?.sections} />
          </TabsContent>

          <TabsContent value="teacher">
            <TeacherCard teacher={course?.teacher} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewSection
              reviews={course.reviews}
              rating={course.rating}
              totalReviews={course.totalRatings}
            />
          </TabsContent>
      </Tabs>
    </div>
  </div>
);
}