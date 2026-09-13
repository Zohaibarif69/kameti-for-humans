'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UsersRound,
  CircleDollarSign,
  Activity,
  Bot,
  Settings,
  CircleHelp,
  TriangleAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isRtl } from '../../lib/i18n';
import Avatar from '../ui/Avatar';

const navItems = [
  { label: 'Overview', key: 'overview' as const, icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Committees', key: 'committees' as const, icon: UsersRound, path: '/committees' },
  { label: 'Payments', key: 'payments' as const, icon: CircleDollarSign, path: '/payments' },
  { label: 'Agent Activity', key: 'agentActivity' as const, icon: Bot, path: '/agent' },
  { label: 'Members', key: 'members' as const, icon: Activity, path: '/members' },
];

const bottomNavItems = [
  { label: 'Settings', key: 'settings' as const, icon: Settings, path: '/settings' },
  { label: 'Help & Support', key: 'help' as const, icon: CircleHelp, path: '/help' },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const { pendingDecisionsCount, organizerProfile, t, language } = useApp();
  const pathname = usePathname();
  const dir = isRtl(language) ? 'rtl' : 'ltr';

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.path}
        onClick={mobile ? onClose : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 group relative ${
          isActive
            ? 'bg-primary-light text-primary-dark'
            : 'text-kameti-text-secondary hover:bg-kameti-surface-2 hover:text-kameti-text'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={17} className={isActive ? 'text-primary' : 'text-kameti-text-muted group-hover:text-kameti-text-secondary'} />
        {t.nav[item.key]}
        {item.path === '/agent' && pendingDecisionsCount > 0 && (
          <span className="ml-auto w-5 h-5 rounded-full bg-warning text-white text-[11px] font-bold flex items-center justify-center">
            {pendingDecisionsCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav dir={dir} className="w-[240px] h-full bg-white border-r border-kameti-border flex flex-col" aria-label="Main navigation">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-kameti-border">
        <Link href="/" onClick={mobile ? onClose : undefined} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-[15px]">K</div>
          <span className="text-[16px] font-bold text-primary-dark tracking-tight">KAMETI</span>
        </Link>
      </div>

      {/* Main nav */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.path} item={item} />)}

        {pendingDecisionsCount > 0 && (
          <Link
            href="/decisions"
            onClick={mobile ? onClose : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 ${
              pathname === '/decisions'
                ? 'bg-warning-bg text-warning border border-warning/20'
                : 'text-warning hover:bg-warning-bg'
            }`}
          >
            <TriangleAlert size={17} />
            {t.nav.decisions}
            <span className="ml-auto w-5 h-5 rounded-full bg-warning text-white text-[11px] font-bold flex items-center justify-center">
              {pendingDecisionsCount}
            </span>
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-kameti-border" />

      {/* Bottom nav */}
      <div className="px-3 py-3 space-y-0.5">
        {bottomNavItems.map(item => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={mobile ? onClose : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-light text-primary-dark'
                  : 'text-kameti-text-secondary hover:bg-kameti-surface-2 hover:text-kameti-text'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-primary' : 'text-kameti-text-muted group-hover:text-kameti-text-secondary'} />
              {t.nav[item.key]}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-kameti-border">
        <div className="flex items-center gap-3">
          <Avatar name={organizerProfile.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-kameti-text truncate">{organizerProfile.name}</p>
            <p className="text-[12px] text-kameti-text-muted">{t.organizerRole}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
