// components/auth/2fa/BackupCodes.jsx
import { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Copy, Download } from "lucide-react";

export function BackupCodes({ codes = [] }) {
  const [showCodes, setShowCodes] = useState(false);

  // In a real app, these would be generated on the server
  const backupCodes = codes.length > 0 ? codes : [
    "ABCD-EFGH-IJKL",
    "MNOP-QRST-UVWX",
    "1234-5678-9012",
    "3456-7890-1234",
    "5678-9012-3456",
    "7890-1234-5678",
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const downloadCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Codes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Save these backup codes in a secure place. You can use them to access
          your account if you lose access to your authentication device.
        </div>

        <div className="grid grid-cols-2 gap-2">
          {showCodes ? (
            backupCodes.map((code, index) => (
              <code
                key={index}
                className="p-2 bg-muted rounded-md font-mono text-sm text-center"
              >
                {code}
              </code>
            ))
          ) : (
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => setShowCodes(true)}
            >
              Show Backup Codes
            </Button>
          )}
        </div>

        {showCodes && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Codes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={downloadCodes}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}