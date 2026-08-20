'use client';

import React from 'react';
import { CheckCircle, AlertCircle, TriangleAlert, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ToastMessage } from '../../types';

const toastConfig = {
  success: { icon: CheckCircle, bg: 'bg-white border-success/30', iconColor: 'text-success' },
  error: { icon: AlertCircle, bg: 'bg-white border-danger/30', iconColor: 'text-danger' },
  warning: { icon: TriangleAlert, bg: 'bg-white border-warning/30', iconColor: 'text-warning' },
  info: { icon: Info, bg: 'bg-white border-info/30', iconColor: 'text-info' },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg toast-enter ${config.bg} w-full sm:w-auto sm:min-w-[280px] sm:max-w-[360px]`} style={{ boxShadow: '0 8px 24px rgba(20, 35, 28, 0.10)' }}>
      <Icon size={18} className={`shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-kameti-text">{toast.title}</p>
        {toast.description && <p className="text-[13px] text-kameti-text-secondary mt-0.5">{toast.description}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-kameti-text-muted hover:bg-kameti-surface-2 transition-all"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    // Mobile: bottom-center above bottom nav; desktop: bottom-right
    <div className="fixed bottom-20 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 items-stretch sm:items-end">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
