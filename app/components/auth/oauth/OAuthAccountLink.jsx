// components/auth/oauth/OAuthAccountLink.jsx
import { useState } from "react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

export function OAuthAccountLink({ provider, existingEmail }) {
  const [showDialog, setShowDialog] = useState(false);

  const handleLink = async () => {
    try {
      // Implement account linking logic
      await initiateOAuthFlow(provider);
    } catch (error) {
      console.error("Error linking account:", error);
    }
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="outline">
        Link {provider} Account
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link {provider} Account</DialogTitle>
            <DialogDescription>
              This will link your {provider} account with your existing account
              ({existingEmail}). You'll be able to sign in using either method.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLink}>Continue with {provider}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}