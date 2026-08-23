import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kameti — AI-powered committee coordination',
  description:
    'Kameti quietly manages the repetitive work behind your community savings circle — so you can focus on the people.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
