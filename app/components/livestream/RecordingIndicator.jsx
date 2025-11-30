import React from 'react';

const RecordingIndicator = ({ isRecording = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`
        h-2.5 w-2.5 rounded-full
        ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}
      `} />
      <span className="text-sm font-medium">
        {isRecording ? 'Recording' : 'Not Recording'}
      </span>
    </div>
  );
};

export default RecordingIndicator;