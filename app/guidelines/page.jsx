import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertCircle, BookOpen, Users, Clock, Shield } from 'lucide-react';

const GuidelinesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Teacher Guidelines</h1>
      
      {/* Introduction Section */}
      <Card className="mb-8 p-6">
        <CardContent>
          <p className="text-lg text-gray-700">
            Welcome to our teaching platform. These guidelines are designed to ensure 
            high-quality education delivery and maintain professional standards across 
            all virtual classrooms.
          </p>
        </CardContent>
      </Card>

      {/* Core Requirements */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <CardContent>
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold">Qualifications</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Valid teaching certification in your subject area</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Minimum of 2 years teaching experience</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Background check clearance</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Professional references verification</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold">Teaching Standards</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Detailed lesson planning and documentation</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Regular student progress assessments</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Differentiated instruction methods</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Integration of technology in teaching</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Professional Conduct */}
      <Card className="mb-8 p-6">
        <CardContent>
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold">Professional Conduct</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Expected Behaviors</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Professional dress code during sessions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Respectful communication with all parties</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Cultural sensitivity and inclusion</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Prohibited Behaviors</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-1" />
                  <span>Personal social media connections with students</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-1" />
                  <span>Sharing personal contact information</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-1" />
                  <span>Outside platform communication</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card className="mb-8 p-6">
        <CardContent>
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold">Technical Requirements</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Equipment</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>High-speed internet (minimum 10 Mbps)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>HD webcam (1080p recommended)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Professional microphone/headset</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Environment</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Quiet, well-lit teaching space</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Professional background or virtual backdrop</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Backup power supply recommended</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="p-6 bg-blue-50">
        <CardContent>
          <p className="text-center text-gray-700">
            Failure to comply with these guidelines may result in suspension or termination 
            of teaching privileges. For any questions or clarifications, please contact our 
            Teacher Support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuidelinesPage;