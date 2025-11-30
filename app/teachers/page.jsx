// app/teachers/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
        if (!response.ok) {
          throw new Error('Failed to fetch teachers');
        }
        const data = await response.json();
        setTeachers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Teachers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <Link href={`/teachers/${teacher._id}`} key={teacher._id}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {teacher.profileImage ? (
                    <img
                      src={teacher.profileImage}
                      alt={`${teacher.firstName} ${teacher.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {/* <span className="text-2xl">
                        {teacher.firstName[0]}
                        {teacher.lastName[0]}
                      </span> */}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">
                      {teacher.firstName} {teacher.lastName}
                    </h2>
                    <p className="text-gray-600">{teacher.department}</p>
                  </div>
                </div>
              </CardHeader>
          
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TeachersPage;
