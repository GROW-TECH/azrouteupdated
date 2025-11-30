// components/auth/2fa/AppAuthSetup.jsx
import { QRCodeSVG } from "qrcode.react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { useState } from "react";

export function AppAuthSetup() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // In a real app, this would be generated on the server
  const secretKey = "JBSWY3DPEHPK3PXP";
  const qrCodeUrl = `otpauth://totp/ConnectEd:user@example.com?secret=${secretKey}&issuer=ConnectEd`;

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
      <div className="space-y-2">
        <h3 className="font-semibold">1. Scan QR Code</h3>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app (e.g., Google Authenticator,
          Authy)
        </p>
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          <QRCodeSVG value={qrCodeUrl} size={200} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">2. Manual Setup</h3>
        <p className="text-sm text-muted-foreground">
          If you can't scan the QR code, enter this code manually in your app:
        </p>
        <code className="block p-2 bg-muted rounded-md font-mono text-sm">
          {secretKey}
        </code>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">3. Verify Setup</h3>
        <p className="text-sm text-muted-foreground">
          Enter the verification code from your authenticator app to complete setup
        </p>
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
      </div>
    </div>
  );
}