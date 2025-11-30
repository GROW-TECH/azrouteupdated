// app/layout.jsx
import './globals.scss';
import { Inter } from 'next/font/google';
import { cn } from '../lib/utils';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: { default: 'Azroute Chess Institute', template: '%s | Azroute Chess Institute' },
  description: 'Transform your future with expert-led learning',
  icons: {
    icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    shortcut: [{ url: '/favicon-32x32.png' }],
    apple: [{ url: '/favicon-32x32.png' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
