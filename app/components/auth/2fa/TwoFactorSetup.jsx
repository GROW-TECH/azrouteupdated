// components/auth/2fa/TwoFactorSetup.jsx
"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { AppAuthSetup } from "./AppAuthSetup";
import { SmsAuthSetup } from "./SmsAuthSetup";
import { BackupCodes } from "./BackupCodes";
import { Shield, Smartphone, QrCode, Key } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";

export function TwoFactorSetup() {
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("app");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={() => setIs2FAEnabled(true)}>Enable 2FA</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Current Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Key className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Backup Codes</h3>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled ? "Generated" : "Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {is2FAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Method</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={selectedMethod}
              onValueChange={setSelectedMethod}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="app">
                  <QrCode className="h-4 w-4 mr-2" />
                  Authenticator App
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <Smartphone className="h-4 w-4 mr-2" />
                  SMS Verification
                </TabsTrigger>
              </TabsList>
              <TabsContent value="app">
                <AppAuthSetup />
              </TabsContent>
              <TabsContent value="sms">
                <SmsAuthSetup />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the additional security layer from your account.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setIs2FAEnabled(false);
                setShowDisableDialog(false);
              }}
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}