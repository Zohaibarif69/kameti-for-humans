'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UsersRound, Bot, TriangleAlert, MoreHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const items = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Committees', icon: UsersRound, path: '/committees' },
  { label: 'Activity', icon: Bot, path: '/agent' },
  { label: 'Decisions', icon: TriangleAlert, path: '/decisions' },
];

interface BottomNavProps {
  onMoreOpen: () => void;
}

export default function BottomNav({ onMoreOpen }: BottomNavProps) {
  const { pendingDecisionsCount } = useApp();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-kameti-border safe-area-bottom" aria-label="Mobile navigation">
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const isDecisions = item.path === '/decisions';

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors relative ${
                isActive ? 'text-primary' : 'text-kameti-text-muted'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={20} />
                {isDecisions && pendingDecisionsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingDecisionsCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-b-full" />
              )}
            </Link>
          );
        })}

        {/* More */}
        <button
          onClick={onMoreOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-kameti-text-muted"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
