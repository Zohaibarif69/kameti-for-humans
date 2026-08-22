'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Bot, TriangleAlert, CheckCircle, Circle, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../ui/Avatar';
import { formatRelativeTime } from '../../mocks/data';

interface TopBarProps {
  title: string;
  breadcrumb?: string;
  onMenuOpen?: () => void;
}

function AgentStatusPanel({ onClose }: { onClose: () => void }) {
  const { agentStatus } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-xl border border-kameti-border shadow-xl z-50 overflow-hidden fade-in" style={{ boxShadow: '0 12px 40px rgba(20,35,28,0.10)' }}>
      <div className="px-4 py-3 border-b border-kameti-border bg-primary-light">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-primary" />
          <span className="text-[13px] font-semibold text-primary-dark">Kameti Agent</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {[
          { label: 'Status', value: 'Active' },
          { label: 'Last checked', value: agentStatus.lastChecked },
          { label: 'Monitoring', value: agentStatus.monitoringCommittee },
          { label: 'Next check', value: agentStatus.nextCheck },
          { label: 'Actions today', value: agentStatus.actionsToday.toString() },
          { label: 'Human decisions', value: agentStatus.humanDecisions.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-[12px] text-kameti-text-muted">{label}</span>
            <span className="text-[12px] font-medium text-kameti-text">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const icons = {
    decision: TriangleAlert,
    payment: CheckCircle,
    cycle: CheckCircle,
    reminder: Circle,
    system: Bot,
  };
  const iconColors = {
    decision: 'text-warning',
    payment: 'text-success',
    cycle: 'text-primary',
    reminder: 'text-info',
    system: 'text-kameti-text-muted',
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-[320px] sm:w-80 bg-white rounded-xl border border-kameti-border shadow-xl z-50 overflow-hidden fade-in" style={{ boxShadow: '0 12px 40px rgba(20,35,28,0.10)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-kameti-border">
        <span className="text-[14px] font-semibold text-kameti-text">Notifications</span>
        <button onClick={markAllNotificationsRead} className="text-[12px] text-primary hover:text-primary-dark font-medium transition-colors">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-kameti-border">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-kameti-text-muted">No notifications</div>
        ) : (
          notifications.map(notif => {
            const Icon = icons[notif.type];
            return (
              <button
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-kameti-bg transition-colors ${!notif.read ? 'bg-primary-light/40' : ''}`}
              >
                <Icon size={15} className={`shrink-0 mt-0.5 ${iconColors[notif.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] ${!notif.read ? 'font-semibold text-kameti-text' : 'font-medium text-kameti-text-secondary'}`}>{notif.title}</p>
                  <p className="text-[12px] text-kameti-text-muted truncate">{notif.description}</p>
                  <p className="text-[11px] text-kameti-text-muted mt-0.5">{formatRelativeTime(notif.createdAt)}</p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function TopBar({ title, breadcrumb, onMenuOpen }: TopBarProps) {
  const { unreadCount, agentStatus } = useApp();
  const [agentOpen, setAgentOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const statusLabel = agentStatus.status === 'active' ? 'Agent Active' :
    agentStatus.status === 'monitoring' ? 'Monitoring' :
    agentStatus.status === 'needs_attention' ? 'Attention needed' : 'Agent offline';
  const statusDot = agentStatus.status === 'active' ? 'bg-success' :
    agentStatus.status === 'needs_attention' ? 'bg-warning' :
    agentStatus.status === 'offline' ? 'bg-danger' : 'bg-info';

  return (
    <header className="h-14 bg-white border-b border-kameti-border flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Hamburger — visible on mobile only */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-kameti-text-muted hover:bg-kameti-surface-2 transition-all shrink-0"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          {breadcrumb && <p className="text-[10px] sm:text-[11px] text-kameti-text-muted font-medium uppercase tracking-wide hidden sm:block">{breadcrumb}</p>}
          <h1 className="text-[14px] sm:text-[15px] font-semibold text-kameti-text leading-tight truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Agent status — hidden on mobile (visible in sidebar and agent page) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => { setAgentOpen(p => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-kameti-surface-2 transition-all text-[13px] font-medium text-kameti-text-secondary"
            aria-label="Agent status"
          >
            <span className={`w-2 h-2 rounded-full ${statusDot} ${agentStatus.status === 'active' ? 'status-dot-active' : ''}`} />
            {statusLabel}
          </button>
          {agentOpen && <AgentStatusPanel onClose={() => setAgentOpen(false)} />}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(p => !p); setAgentOpen(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-kameti-text-muted hover:bg-kameti-surface-2 transition-all"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Avatar */}
        <Avatar name="Raza Ahmed" size="sm" className="hidden sm:flex" />
      </div>
    </header>
  );
}
