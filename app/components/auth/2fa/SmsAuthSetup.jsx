// components/auth/2fa/SmsAuthSetup.jsx
import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Alert, AlertDescription } from "../../ui/alert";
import { Phone } from "lucide-react";

export function SmsAuthSetup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const sendCode = async () => {
    try {
      // Send verification code logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCodeSent(true);
    } catch (error) {
      console.error("Failed to send code");
    }
  };

  const verifyCode = async () => {
    setIsVerifying(true);
    try {
      // Verify code logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Verification successful");
    } catch (error) {
      console.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <Alert>
        <Phone className="h-4 w-4" />
        <AlertDescription>
          Standard message and data rates may apply.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
            />
            <Button onClick={sendCode} disabled={codeSent}>
              Send Code
            </Button>
          </div>
        </div>

        {codeSent && (
          <div className="grid gap-2">
            <Label htmlFor="code">Verification Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <Button onClick={verifyCode} disabled={isVerifying}>
                Verify
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}