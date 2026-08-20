'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      {/* Full-width on mobile, fixed 420px on sm+ */}
      <div className="relative w-full sm:w-[420px] sm:max-w-[90vw] h-full bg-white shadow-2xl drawer-enter flex flex-col" style={{ boxShadow: '-8px 0 40px rgba(20, 35, 28, 0.10)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-kameti-border shrink-0">
          {title && <h2 className="text-[15px] font-semibold text-kameti-text tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-kameti-text-muted hover:bg-kameti-surface-2 hover:text-kameti-text transition-all"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
