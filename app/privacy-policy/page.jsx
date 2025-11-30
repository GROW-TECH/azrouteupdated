// app/privacy-policy/page.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Privacy Policy - ConnectED</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Last updated: January 2025 - This privacy policy explains how ConnectED (myconnected.co.uk) processes your personal data in accordance with the UK Data Protection Act 2018 and GDPR.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">1. Who We Are</h2>
              <p className="text-gray-600">
                ConnectED (myconnected.co.uk) is an EdTech and events booking platform. We are registered in the United Kingdom and act as the data controller for personal information collected through our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">2. Information We Collect</h2>
              <div className="space-y-2">
                <p className="text-gray-600">We collect and process the following personal information:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Name, email address, and contact details</li>
                  <li>Professional background and educational qualifications</li>
                  <li>Event booking history and preferences</li>
                  <li>Payment information</li>
                  <li>Learning progress and assessment data</li>
                  <li>Communications and feedback</li>
                  <li>Technical data (IP address, browser type, device information)</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Providing access to educational content and events</li>
                <li>Processing event bookings and payments</li>
                <li>Tracking learning progress and issuing certificates</li>
                <li>Sending essential communications about your bookings and account</li>
                <li>Personalizing your learning experience</li>
                <li>Improving our services and platform</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">4. Legal Basis for Processing</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Contract: Processing necessary for providing our services</li>
                <li>Legitimate Interests: Platform improvement and security</li>
                <li>Consent: Marketing communications (where applicable)</li>
                <li>Legal Obligation: Compliance with UK laws</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">5. Data Retention</h2>
              <p className="text-gray-600">
                We retain your data for as long as necessary to provide our services and comply with legal obligations. Account data is kept for 6 years after account closure. Learning records are retained for 11 years.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">6. Your Rights</h2>
              <p className="text-gray-600">Under GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request data erasure</li>
                <li>Restrict processing</li>
                <li>Data portability</li>
                <li>Object to processing</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">7. Contact Us</h2>
              <p className="text-gray-600">
                For privacy inquiries: privacy@myconnected.co.uk<br />
                You can also complain to the ICO at 0303 123 1113 or visit ico.org.uk
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

