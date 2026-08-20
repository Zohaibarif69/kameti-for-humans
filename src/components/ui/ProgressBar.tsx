import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  size?: 'sm' | 'md';
  color?: 'primary' | 'success' | 'warning';
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
};

export default function ProgressBar({ value, max, className = '', size = 'md', color = 'primary' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full bg-kameti-surface-2 rounded-full overflow-hidden ${height} ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div
        className={`${height} ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
