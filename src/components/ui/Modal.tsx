'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Bottom sheet on mobile, centered on sm+ */}
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl modal-enter overflow-hidden`} style={{ boxShadow: '0 12px 40px rgba(20, 35, 28, 0.12)' }}>
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-kameti-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-kameti-border">
          {title && <h2 className="text-[15px] sm:text-[16px] font-semibold text-kameti-text">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-kameti-text-muted hover:bg-kameti-surface-2 hover:text-kameti-text transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-kameti-border bg-kameti-bg flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
