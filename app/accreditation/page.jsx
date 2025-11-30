import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, CheckCircle, BookOpen, Users, Clock, Shield, Star } from 'lucide-react';

const CPCAccreditationPage = () => {
  const accreditationSteps = [
    {
      step: 1,
      title: "Initial Application",
      description: "Submit your credentials, qualifications, and teaching experience documentation."
    },
    {
      step: 2,
      title: "Documentation Review",
      description: "Our accreditation team reviews your submitted materials and verifies credentials."
    },
    {
      step: 3,
      title: "Skills Assessment",
      description: "Complete teaching demonstrations and professional knowledge assessments."
    },
    {
      step: 4,
      title: "Final Evaluation",
      description: "Review by the accreditation board and certification decision."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">CPC Accreditation</h1>
        <div className="flex justify-center mb-6">
          <Award className="w-16 h-16 text-blue-600" />
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Earn your Certified Professional Certification (CPC) and join the ranks of 
          distinguished online educators committed to excellence in virtual education.
        </p>
      </div>

      {/* Why Get Certified */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            Why Get CPC Certified
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Professional Recognition</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Industry-recognized credentials</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Enhanced professional status</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Career Advancement</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Higher earning potential</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Leadership opportunities</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Professional Development</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Ongoing learning resources</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Networking opportunities</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Requirements */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            Certification Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Educational Requirements</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Master's degree in teaching field or related discipline</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Valid teaching certification in your jurisdiction</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Minimum 5 years of classroom teaching experience</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Demonstrated expertise in online teaching methodologies</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Professional Requirements</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Completion of 40 professional development hours</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Successful teaching demonstration assessment</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Portfolio of student success metrics and testimonials</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                  <span>Passing score on CPC knowledge assessment</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Process */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Clock className="w-6 h-6 text-blue-600 mr-2" />
            Certification Process
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {accreditationSteps.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-blue-50 p-6 rounded-lg h-full">
                  <div className="text-3xl font-bold text-blue-600 mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Requirements */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            Maintaining Your Certification
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>To maintain your CPC status, you must complete the following every two years:</p>
            <ul className="grid md:grid-cols-2 gap-4">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>20 hours of professional development</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Submission of updated teaching portfolio</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Demonstration of student success metrics</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                <span>Peer review assessment</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Application Button */}
      <div className="text-center">
        {/* <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Apply for CPC Certification
        </button> */}
        <p className="mt-4 text-gray-600">
          Questions about certification? Contact our accreditation team at 
          <a href="mailto:accreditation@example.com" className="text-blue-600 ml-1">
            accreditation@myconnected.co.uk
          </a>
        </p>
      </div>
    </div>
  );
};

export default CPCAccreditationPage;