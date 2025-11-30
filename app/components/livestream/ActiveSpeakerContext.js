// components/livestream/ActiveSpeakerContext.js
import { createContext, useContext, useState, useEffect } from 'react';
  
const ActiveSpeakerContext = createContext();

export function ActiveSpeakerProvider({ children }) {
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [audioAnalyzers, setAudioAnalyzers] = useState(new Map());

  const addAudioTrack = (participantId, track) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);

    setAudioAnalyzers(prev => new Map(prev).set(participantId, analyzer));
    detectActiveSpeaker();
  };

  const removeAudioTrack = (participantId) => {
    setAudioAnalyzers(prev => {
      const newMap = new Map(prev);
      newMap.delete(participantId);
      return newMap;
    });
  };

  const detectActiveSpeaker = () => {
    let maxVolume = -Infinity;
    let activeParticipant = null;

    audioAnalyzers.forEach((analyzer, participantId) => {
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      if (volume > maxVolume && volume > 30) { // Threshold
        maxVolume = volume;
        activeParticipant = participantId;
      }
    });

    if (activeParticipant !== activeSpeaker) {
      setActiveSpeaker(activeParticipant);
    }
  };

  useEffect(() => {
    const interval = setInterval(detectActiveSpeaker, 100);
    return () => clearInterval(interval);
  }, [audioAnalyzers]);

  return (
    <ActiveSpeakerContext.Provider value={{ 
      activeSpeaker,
      addAudioTrack,
      removeAudioTrack
    }}>
      {children}
    </ActiveSpeakerContext.Provider>
  );
}

export const useActiveSpeaker = () => {
  const context = useContext(ActiveSpeakerContext);
  if (!context) {
    throw new Error('useActiveSpeaker must be used within an ActiveSpeakerProvider');
  }
  return context;
};
