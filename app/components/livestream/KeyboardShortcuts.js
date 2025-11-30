// components/livestream/KeyboardShortcuts.js
import { useEffect } from 'react';

const SHORTCUTS = {
  'alt+m': 'toggleAudio',
  'alt+v': 'toggleVideo',
  'alt+s': 'toggleScreenShare',
  'alt+r': 'toggleRecording',
  'alt+c': 'toggleChat',
  'alt+p': 'toggleParticipants',
  'alt+f': 'toggleFullscreen',
  'alt+h': 'toggleHand',
  'alt+l': 'toggleLayout',
  'alt+e': 'showEndDialog',
  'space': 'pushToTalk', // While pressed
  'esc': 'exitFullscreen'
};

export function useKeyboardShortcuts({
  enabled = true,
  handlers = {},
  dependencies = []
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input/textarea
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      const key = [
        event.altKey && 'alt',
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.key.toLowerCase()
      ]
        .filter(Boolean)
        .join('+');

      const action = SHORTCUTS[key];
      if (action && handlers[action]) {
        event.preventDefault();
        handlers[action](event);
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space' && handlers.endPushToTalk) {
        handlers.endPushToTalk();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, ...dependencies]);
}

// Helper component to show shortcuts overlay
export function ShortcutsOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Alt + M', description: 'Mute/Unmute microphone' },
    { key: 'Alt + V', description: 'Start/Stop video' },
    { key: 'Alt + S', description: 'Share screen' },
    { key: 'Alt + R', description: 'Start/Stop recording' },
    { key: 'Alt + C', description: 'Open/Close chat' },
    { key: 'Alt + P', description: 'Show/Hide participants' },
    { key: 'Alt + F', description: 'Toggle fullscreen' },
    { key: 'Alt + H', description: 'Raise/Lower hand' },
    { key: 'Alt + L', description: 'Change layout' },
    { key: 'Space', description: 'Push to talk (hold)' },
    { key: 'Esc', description: 'Exit fullscreen' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-lg p-6 w-[480px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{description}</span>
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
