// components/auth/oauth/ConnectedAccounts.jsx
"use client"
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Icons } from "../../icons";
import { Switch } from "../../ui/switch";
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

export function ConnectedAccounts() {
  const [disconnectAccount, setDisconnectAccount] = useState(null);
  const [syncPreferences, setSyncPreferences] = useState({
    google: { profile: true, calendar: true },
    github: { profile: true, repositories: false },
    microsoft: { profile: true, calendar: false },
    apple: { profile: true },
  });

  const accounts = [
    {
      id: "google",
      name: "Google",
      icon: Icons.google,
      email: "user@gmail.com",
      connected: true,
      lastSync: "2024-10-30",
      syncOptions: [
        { id: "profile", label: "Profile Information" },
        { id: "calendar", label: "Calendar Events" },
      ],
    },
    {
      id: "github",
      name: "GitHub",
      icon: Icons.github,
      username: "devuser",
      connected: true,
      lastSync: "2024-10-29",
      syncOptions: [
        { id: "profile", label: "Profile Information" },
        { id: "repositories", label: "Repository Access" },
      ],
    },
    {
      id: "microsoft",
      name: "Microsoft",
      icon: Icons.microsoft,
      email: "user@outlook.com",
      connected: false,
      syncOptions: [
        { id: "profile", label: "Profile Information" },
        { id: "calendar", label: "Calendar Events" },
      ],
    },
    {
      id: "apple",
      name: "Apple",
      icon: Icons.apple,
      email: "user@icloud.com",
      connected: false,
      syncOptions: [
        { id: "profile", label: "Profile Information" },
      ],
    },
  ];

  const handleConnect = async (accountId) => {
    // Implement OAuth connection logic
    console.log(`Connecting to ${accountId}`);
  };

  const handleDisconnect = async (accountId) => {
    // Implement disconnect logic
    console.log(`Disconnecting ${accountId}`);
    setDisconnectAccount(null);
  };

  const toggleSync = (accountId, optionId) => {
    setSyncPreferences((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [optionId]: !prev[accountId][optionId],
      },
    }));
  };

  return (
    <div className="space-y-6">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-background rounded-full">
                  {/* <account.icon className="h-6 w-6" /> */}
                </div>
                <div>
                  <CardTitle>{account.name}</CardTitle>
                  <CardDescription>
                    {account.connected
                      ? `Connected as ${account.email || account.username}`
                      : "Not connected"}
                  </CardDescription>
                </div>
              </div>
              {account.connected ? (
                <Button
                  variant="outline"
                  onClick={() => setDisconnectAccount(account)}
                >
                  Disconnect
                </Button>
              ) : (
                <Button onClick={() => handleConnect(account.id)}>
                  Connect
                </Button>
              )}
            </div>
          </CardHeader>
          {account.connected && (
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Last synced: {account.lastSync}
                </div>
                <div className="space-y-3">
                  {account.syncOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between"
                    >
                      <div className="text-sm">{option.label}</div>
                      <Switch
                        checked={syncPreferences[account.id][option.id]}
                        onCheckedChange={() =>
                          toggleSync(account.id, option.id)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <AlertDialog
        open={!!disconnectAccount}
        onOpenChange={() => setDisconnectAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {disconnectAccount?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your {disconnectAccount?.name}{" "}
              account? This will remove all synced data and preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleDisconnect(disconnectAccount?.id)}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}