'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ToastContainer from '../ui/Toast';

const pageTitles: Record<string, { title: string; breadcrumb?: string }> = {
  '/dashboard': { title: 'Overview' },
  '/committees': { title: 'Committees' },
  '/payments': { title: 'Payments' },
  '/agent': { title: 'Kameti Agent' },
  '/members': { title: 'Members' },
  '/decisions': { title: 'Decisions' },
  '/settings': { title: 'Settings' },
  '/help': { title: 'Help & Support' },
};

function getPageMeta(path: string) {
  if (pageTitles[path]) return pageTitles[path];
  if (path.startsWith('/committees/')) return { title: 'Committee', breadcrumb: 'Committees' };
  return { title: 'Kameti' };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = getPageMeta(pathname);

  return (
    <div className="flex h-full bg-kameti-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile/tablet sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={meta.title} breadcrumb={meta.breadcrumb} onMenuOpen={() => setSidebarOpen(true)} />
        {/* Extra bottom padding on mobile to clear the bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav onMoreOpen={() => setSidebarOpen(true)} />

      <ToastContainer />
    </div>
  );
}
