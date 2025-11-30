"use client"
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Video, 
  File, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

const HelpPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState({});

  const toggleFaq = (id) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqCategories = {
    general: [
      {
        id: 'g1',
        question: 'How do I get started with online teaching?',
        answer: 'To begin teaching online, first complete your profile setup, verify your credentials, and set up your virtual classroom environment. Our onboarding guide will walk you through each step.'
      },
      {
        id: 'g2',
        question: 'What technical requirements do I need?',
        answer: 'You need a reliable high-speed internet connection (minimum 10 Mbps), HD webcam, quality microphone/headset, and a quiet teaching space with good lighting.'
      },
      {
        id: 'g3',
        question: 'How do I get paid?',
        answer: 'Payments are processed automatically every two weeks. You can set up direct deposit or PayPal in your account settings.'
      }
    ],
    technical: [
      {
        id: 't1',
        question: "What should I do if my video isn't working?",
        answer: 'First, check your camera permissions in browser settings. Then verify your webcam is properly connected and selected in the platform settings. If issues persist, try a different browser.'
      },
      {
        id: 't2',
        question: 'How do I share my screen during class?',
        answer: 'Click the "Share Screen" button in your virtual classroom toolbar. Select the window or application you want to share, then click "Share".'
      },
      {
        id: 't3',
        question: 'What browsers are supported?',
        answer: 'We recommend using the latest versions of Chrome, Firefox, or Edge. Safari is supported but may have limited features.'
      }
    ],
    classes: [
      {
        id: 'c1',
        question: 'How do I schedule a class?',
        answer: 'Go to your dashboard, click "Schedule Class," select available time slots, set the class duration and topic, then click "Confirm Schedule".'
      },
      {
        id: 'c2',
        question: 'What happens if I need to cancel a class?',
        answer: 'You can cancel a class up to 24 hours before the scheduled time without penalty. Last-minute cancellations may affect your rating.'
      },
      {
        id: 'c3',
        question: 'How long are typical classes?',
        answer: 'Classes can be scheduled for 30, 45, 60, or 90 minutes. Most teachers prefer 60-minute sessions for optimal learning.'
      }
    ]
  };

  const quickLinks = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Teaching Guides",
      description: "Access comprehensive teaching resources and best practices",
      link: "/guides"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Tutorial Videos",
      description: "Watch step-by-step platform tutorials",
      link: "/tutorials"
    },
    {
      icon: <File className="w-6 h-6" />,
      title: "Documentation",
      description: "Read detailed platform documentation",
      link: "/docs"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Community Forum",
      description: "Connect with other teachers and share experiences",
      link: "/community"
    }
  ];

  const filteredFaqs = faqCategories[activeCategory].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-lg text-gray-600">
          Find answers to common questions and get support when you need it
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search help articles..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2 mb-12">
        {quickLinks.map((link, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="text-blue-600 mr-4">
                  {link.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{link.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  {/* <a href={link.link} className="text-blue-600 text-sm hover:underline">
                    Learn more →
                  </a> */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        
        {/* Category Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setActiveCategory('general')}
          >
            General
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setActiveCategory('technical')}
          >
            Technical
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'classes' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setActiveCategory('classes')}
          >
            Classes
          </button>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className="cursor-pointer" onClick={() => toggleFaq(faq.id)}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{faq.question}</h3>
                  {expandedFaqs[faq.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                {expandedFaqs[faq.id] && (
                  <p className="mt-4 text-gray-600">{faq.answer}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <Card className="bg-blue-50">
        <CardContent className="p-6">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Still Need Help?</h2>
            <p className="text-gray-600 mb-4">
              Our support team is available 24/7 to assist you with any questions or concerns
            </p>
            <div className="space-x-4">
              {/* <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors">
                Live Chat
              </button> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;