'use client';

import { createContext, useContext, useMemo } from 'react';

const NotificationContext = createContext({ notify: () => {} });

export function NotificationProvider({ children }) {
  const api = useMemo(() => ({
    notify: (msg) => {
      // plug your toast library here if you want
      // e.g. import { toast } from 'sonner'; toast(msg);
      console.log('[Notification]', msg);
    },
  }), []);

  return (
    <NotificationContext.Provider value={api}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
