import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Calendar, Video, Award } from 'lucide-react';

const HowItWorksPage = () => {
  const steps = [
    {
      icon: <UserPlus className="w-12 h-12 text-blue-600" />,
      title: "Create Your Profile",
      description: "Sign up and create your detailed profile. Teachers can showcase their expertise, while students can specify their learning goals."
    },
    {
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      title: "Schedule Sessions",
      description: "Browse available time slots and book sessions that fit your schedule. Our flexible booking system makes it easy to find the perfect time."
    },
    {
      icon: <Video className="w-12 h-12 text-blue-600" />,
      title: "Join Virtual Classroom",
      description: "Connect through our state-of-the-art virtual classroom platform, equipped with interactive tools for an engaging learning experience."
    },
    {
      icon: <Award className="w-12 h-12 text-blue-600" />,
      title: "Track Progress",
      description: "Monitor learning progress through detailed analytics, achievement badges, and regular assessment reports."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">How It Works</h1>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={index} className="p-6">
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{step.icon}</div>
                <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card className="p-6">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4 text-center">Additional Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">For Teachers</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Flexible scheduling options</li>
                  <li>Built-in lesson planning tools</li>
                  <li>Automated payment processing</li>
                  <li>Professional development resources</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">For Students</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Personalized learning paths</li>
                  <li>Access to learning materials</li>
                  <li>Progress tracking dashboard</li>
                  <li>24/7 support access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowItWorksPage;