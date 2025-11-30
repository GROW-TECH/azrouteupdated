"use client"
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqs = [
    {
      question: "What programs does Azroute Chess Institute offer?",
      answer:
        "We offer level-based group classes (Beginner, Intermediate, Advanced), dedicated kids batches, adult batches, 1-on-1 coaching, tournament preparation, opening repertoire building, tactics/endgame intensives, weekend bootcamps, and regular practice tournaments with game analysis."
    },
    {
      question: "How do live online classes work?",
      answer:
        "Classes run in real time over video with an interactive chessboard. Coaches annotate positions, review student games, assign homework, and take Q&A. You can chat, solve positions live, and get instant feedback—just like an in-person session, but from home."
    },
    {
      question: "Do you provide certificates or official ratings?",
      answer:
        "We issue course completion certificates for our programs. Official chess ratings are managed by federations (e.g., FIDE/state associations). We prepare you for rated events and guide you on how to participate to earn or improve your rating."
    },
    {
      question: "Can I access class materials after sessions?",
      answer:
        "Yes. Students get access to class recordings (where available), PGN files of analyzed games, study notes, and curated puzzle sets inside the student dashboard for a set period after each session."
    },
    {
      question: "What if I miss a live class?",
      answer:
        "No problem—recordings are shared (where available) so you can catch up. You can also request a makeup in another batch or a short 1-on-1 recap, subject to coach and slot availability."
    }
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className='bg-gray-50'>
      <div className="w-full max-w-4xl mx-auto px-04 py-16">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-12">
          Frequently Asked Questions
        </h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-blue-50 rounded-lg overflow-hidden"
            >
              <button
                className="w-full text-left p-4 flex justify-between items-center"
                onClick={() => toggleQuestion(index)}
              >
                <span className="text-blue-600 font-medium">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                    openQuestion === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openQuestion === index ? 'max-h-96 p-4 pt-0' : 'max-h-0'
                }`}
              >
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
