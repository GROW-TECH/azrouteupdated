import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

const ErrorAlert = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 w-96 z-50 animate-in slide-in-from-top-2">
      <Alert variant="destructive" className="border-red-500 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="text-red-800">Error</AlertTitle>
        <AlertDescription className="text-red-700 mt-1">
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-red-800 hover:text-red-900"
          >
            ×
          </button>
        )}
      </Alert>
    </div>
  );
};
