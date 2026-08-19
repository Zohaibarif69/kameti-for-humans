import React from 'react';
import { CheckCircle, Clock, TriangleAlert, Circle, AlertCircle } from 'lucide-react';
import type { PaymentStatus } from '../../types';

interface BadgeProps {
  status: PaymentStatus | 'active' | 'needs_attention' | 'completed' | 'paused' | 'on_track';
  className?: string;
}

const statusConfig = {
  paid: { label: 'Paid', icon: CheckCircle, bg: 'bg-success-bg', text: 'text-success', border: 'border-success/20' },
  pending: { label: 'Pending', icon: Circle, bg: 'bg-kameti-surface-2', text: 'text-kameti-text-secondary', border: 'border-kameti-border' },
  overdue: { label: 'Overdue', icon: TriangleAlert, bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning/20' },
  under_review: { label: 'Under review', icon: Clock, bg: 'bg-info-bg', text: 'text-info', border: 'border-info/20' },
  disputed: { label: 'Disputed', icon: AlertCircle, bg: 'bg-danger-bg', text: 'text-danger', border: 'border-danger/20' },
  active: { label: 'Active', icon: CheckCircle, bg: 'bg-success-bg', text: 'text-success', border: 'border-success/20' },
  needs_attention: { label: 'Needs attention', icon: TriangleAlert, bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning/20' },
  completed: { label: 'Complete', icon: CheckCircle, bg: 'bg-primary-light', text: 'text-primary-dark', border: 'border-primary/20' },
  paused: { label: 'Paused', icon: Circle, bg: 'bg-kameti-surface-2', text: 'text-kameti-text-secondary', border: 'border-kameti-border' },
  on_track: { label: 'On track', icon: CheckCircle, bg: 'bg-success-bg', text: 'text-success', border: 'border-success/20' },
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}
