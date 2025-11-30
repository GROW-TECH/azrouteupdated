"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Video,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { use } from 'react';

export default function EventRegistrationPage({ params }) {
  const router = useRouter();
  const { eventId } =use(params)
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [formData, setFormData] = useState({
    dietary: '',
    specialRequirements: '',
    questions: []
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/student/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        setEvent(data.event);
        
        // Pre-populate questions from event
        if (data.event.registrationQuestions) {
          setFormData(prev => ({
            ...prev,
            questions: data.event.registrationQuestions.map(q => ({
              question: q,
              answer: ''
            }))
          }));
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleTierSelection = (tier) => {
    setSelectedTier(tier);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionAnswer = (index, answer) => {
    setFormData(prev => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        answer
      };
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
  };

  const handleRegistration = async () => {
    try {
      const response = await fetch('/api/student/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ticketTierId: selectedTier.id,
          registrationDetails: {
            ...formData
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      
      // If payment is required, redirect to payment
      if (data.requiresPayment) {
        // Redirect to payment page with registration ID
        router.push(`/dashboard/student/payments/${data.registrationId}`);
      } else {
        // Show success and redirect to event details
        setRegistrationStep(3);
        setTimeout(() => {
          router.push(`/dashboard/student/events/${eventId}`);
        }, 2000);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{event.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.startDate)}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {event.duration} hours
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {event.currentRegistrations} registered
          </div>
          {event.location.type === 'online' ? (
            <Badge variant="secondary">
              <Video className="h-4 w-4 mr-1" />
              Online Event
            </Badge>
          ) : (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {event.location.city}, {event.location.country}
            </div>
          )}
        </div>
      </div>

      {/* Registration Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md">
          <div className={`flex flex-col items-center ${registrationStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              registrationStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>1</div>
            <span className="text-sm">Select Ticket</span>
          </div>
          <div className="flex-1 h-px bg-border mx-4"></div>
          <div className={`flex flex-col items-center ${registrationStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              registrationStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>2</div>
            <span className="text-sm">Registration Details</span>
          </div>
          <div className="flex-1 h-px bg-border mx-4"></div>
          <div className={`flex flex-col items-center ${registrationStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              registrationStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>3</div>
            <span className="text-sm">Confirmation</span>
          </div>
        </div>
      </div>

      {registrationStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Ticket Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedTier?.id} 
              onValueChange={(value) => {
                const tier = event.ticketTiers.find(t => t.id === value);
                handleTierSelection(tier);
              }}
              className="space-y-4"
            >
              {event.ticketTiers.map((tier) => (
                <div key={tier.id}>
                  <label
                    htmlFor={`tier-${tier.id}`}
                    className={`block p-4 rounded-lg border transition-colors cursor-pointer hover:border-primary ${
                      selectedTier?.id === tier.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <RadioGroupItem 
                        value={tier.id} 
                        id={`tier-${tier.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{tier.name}</h3>
                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {tier.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">${tier.price}</p>
                            <p className="text-sm text-muted-foreground">
                              {tier.availableCount} spots left
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setRegistrationStep(2)}
              disabled={!selectedTier}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {registrationStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dietary Requirements */}
            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary Requirements (Optional)</Label>
              <Input
                id="dietary"
                value={formData.dietary}
                onChange={(e) => handleInputChange('dietary', e.target.value)}
                placeholder="Any dietary restrictions or preferences"
              />
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label htmlFor="special">Special Requirements (Optional)</Label>
              <Input
                id="special"
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Any accessibility needs or special requirements"
              />
            </div>

            {/* Event-specific Questions */}
            {formData.questions.map((q, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`}>{q.question}</Label>
                <Input
                  id={`question-${index}`}
                  value={q.answer}
                  onChange={(e) => handleQuestionAnswer(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setRegistrationStep(1)}
            >
              Back
            </Button>
            <Button
              onClick={handleRegistration}
            >
              Complete Registration
              {selectedTier.price > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <CreditCard className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {registrationStep === 3 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
            <p className="text-muted-foreground">
              You have successfully registered for the event.
              {selectedTier.price > 0 
                ? " Proceeding to payment..." 
                : " Redirecting to event details..."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}