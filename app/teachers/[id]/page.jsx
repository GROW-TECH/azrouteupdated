
// app/teachers/[id]/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const TeacherProfilePage = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await fetch(`/api/teachers/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch teacher details');
        }
        const data = await response.json();
        setTeacher(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!teacher) {
    return <div className="text-center">Teacher not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/teachers" className="text-blue-600 hover:underline mb-6 block">
        ← Back to Teachers
      </Link>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-6">
            {teacher.profileImage ? (
              <img
                src={teacher.profileImage}
                alt={`${teacher.firstName} ${teacher.lastName}`}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                {/* <span className="text-4xl">
                  {teacher.firstName[0]}
                  {teacher.lastName[0]}
                </span> */}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {teacher.firstName} {teacher.middleName} {teacher.lastName}
              </h1>
              <p className="text-xl text-gray-600">{teacher.department}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
              <div className="space-y-3">
                <p><strong>Qualification:</strong> {teacher.qualification}</p>
                <p><strong>Experience:</strong> {teacher.experience}</p>
                <p><strong>Subjects:</strong> {teacher.subjectsToTeach.join(', ')}</p>
                <p><strong>Email:</strong> {teacher.email}</p>
                <p><strong>Phone:</strong> {teacher.phoneNumber}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <p><strong>Total Students:</strong> {teacher.stats.totalStudents}</p>
                <p><strong>Active Courses:</strong> {teacher.stats.activeCourses}</p>
                <p><strong>Completion Rate:</strong> {teacher.stats.completionRate}%</p>
              </div>
            </div>
          </div>
          
          {teacher.bio && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Biography</h2>
              <p className="text-gray-700">{teacher.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfilePage;