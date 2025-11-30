// app/privacy-policy/page.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// app/terms/page.jsx
export default function Terms() {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Terms and Conditions - ConnectED</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">1. Platform Usage</h2>
                <p className="text-gray-600">
                  By using ConnectED (myconnected.co.uk), you agree to these terms and conditions. Our platform provides educational content and event booking services subject to these terms.
                </p>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">2. User Obligations</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Provide accurate registration information</li>
                  <li>Maintain confidentiality of login credentials</li>
                  <li>Use the platform for legitimate educational purposes</li>
                  <li>Comply with UK laws and regulations</li>
                  <li>Respect intellectual property rights</li>
                </ul>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">3. Data Protection</h2>
                <p className="text-gray-600">We follow these GDPR principles:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Lawfulness, fairness, and transparency</li>
                  <li>Purpose limitation</li>
                  <li>Data minimization</li>
                  <li>Accuracy</li>
                  <li>Storage limitation</li>
                  <li>Integrity and confidentiality</li>
                  <li>Accountability</li>
                </ul>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">4. Event Bookings</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Bookings are confirmed upon payment</li>
                  <li>Cancellation policies apply as specified per event</li>
                  <li>We reserve the right to modify or cancel events</li>
                  <li>Refunds are processed according to our refund policy</li>
                </ul>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">5. Intellectual Property</h2>
                <p className="text-gray-600">
                  All content on ConnectED is protected by copyright. Users may not reproduce, distribute, or create derivative works without permission.
                </p>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">6. Platform Security</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Regular security assessments</li>
                  <li>Encrypted data transmission</li>
                  <li>Secure payment processing</li>
                  <li>Access controls and authentication</li>
                  <li>Regular backups</li>
                </ul>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">7. Limitation of Liability</h2>
                <p className="text-gray-600">
                  ConnectED provides services "as is" and does not guarantee uninterrupted access. We are not liable for indirect losses or damages.
                </p>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">8. Changes to Terms</h2>
                <p className="text-gray-600">
                  We may update these terms. Users will be notified of significant changes via email or platform notifications.
                </p>
              </section>
  
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">9. Contact Information</h2>
                <p className="text-gray-600">
                  For queries about these terms:<br />
                  Email: support@myconnected.co.uk<br />
                  Website: myconnected.co.uk
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }