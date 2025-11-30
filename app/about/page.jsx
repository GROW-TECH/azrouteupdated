import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              We are dedicated to revolutionizing online education by connecting qualified teachers 
              with students worldwide. Our platform facilitates seamless learning experiences,
              ensuring quality education is accessible to all.
            </p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
            <p className="text-gray-600 mb-4">
              To create a global educational ecosystem where knowledge knows no boundaries,
              empowering both educators and learners to achieve their full potential.
            </p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4">What Sets Us Apart</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Rigorous teacher verification process</li>
              <li>Interactive learning tools and resources</li>
              <li>Personalized learning experiences</li>
              <li>24/7 support for teachers and students</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Excellence in education</li>
              <li>Innovation in teaching methods</li>
              <li>Inclusivity and accessibility</li>
              <li>Continuous improvement</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;