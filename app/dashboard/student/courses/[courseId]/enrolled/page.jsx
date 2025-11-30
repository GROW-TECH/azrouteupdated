"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Clock,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Star,
  DollarSign,
  Lock,
  Video
} from "lucide-react";
import { use } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CourseDetailsPage({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const { courseId } =use(params)

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [processingPurchase, setProcessingPurchase] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`/api/student/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch course details');
        const data = await response.json();
        setCourse(data.course);
        // setEnrollment(data.enrollment);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // const handlePurchase = async () => {
  //   try {
  //     setProcessingPurchase(true);
  //     const response = await fetch('/api/student/courses/purchase', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         courseId: course.id
  //       }),
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.error || 'Failed to process purchase');
  //     }

  //     const { sessionId } = await response.json();
      
  //     // Redirect to Stripe Checkout
  //     const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  //     await stripe.redirectToCheckout({ sessionId });

  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setProcessingPurchase(false);
  //   }
  // };

  const startCourse = (lessonId) => {
    router.push(`/dashboard/student/courses/${courseId}/learn/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Course Header */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {Math.ceil(course.totalDuration / 60)} hours
            </Badge>
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              {course.totalLessons} lessons
            </Badge>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {course.enrollments} students
            </Badge>
            {course.rating > 0 && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                {course.rating.toFixed(1)}
              </Badge>
            )}
            <Badge>
              {course.level}
            </Badge>
          </div>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        {/* Purchase/Progress Card */}
        {/* <Card className="h-fit">
          <CardContent className="pt-6">
            {enrollment ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(enrollment.progress)}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => startCourse(enrollment.lastAccessedLessonId)}
                >
                  {enrollment.progress === 0 ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Learning
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Continue Learning
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    ${course.price === 0 ? 'Free' : course.price}
                  </p>
                  {course.price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      One-time payment
                    </p>
                  )}
                </div>
                <Button 
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={processingPurchase}
                >
                  {processingPurchase ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      {course.price === 0 ? 'Enroll Now' : 'Purchase Course'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Course Content */}
      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList>
          <TabsTrigger value="curriculum">
            <BookOpen className="h-4 w-4 mr-2" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                {course.totalLessons} lessons • {Math.ceil(course.totalDuration / 60)} hours total
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {course.sections.map((section, sectionIndex) => (
                  <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-start">
                        <span className="font-medium">{section.title}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {section.lessons.length} lessons
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {section.lessons.map((lesson, lessonIndex) => {
                          const isCompleted = enrollment?.lessonsProgress?.find(
                            p => p.lessonId === lesson._id
                          )?.completed;
                          
                          return (
                            <div
                              key={lessonIndex}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50"
                            >
                              <div className="flex items-center space-x-2">
                                {enrollment ? (
                                  isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                                <span>{lesson.title}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.ceil(lesson.duration / 60)} min
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <h3>Prerequisites</h3>
                <p>{course.prerequisites || 'No prerequisites required'}</p>

                <h3 className="mt-6">Learning Objectives</h3>
                {course.objectives && course.objectives.length > 0 ? (
                  <ul>
                    {course.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No specific objectives listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}