import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className = '', padding = 'md', onClick, hoverable = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-kameti-border ${paddingClasses[padding]} ${hoverable ? 'cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-150' : ''} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(20, 35, 28, 0.06)' }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
}

export function StatCard({ label, value, sub, icon, variant = 'default' }: StatCardProps) {
  const valueColor = variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-kameti-text';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-kameti-text-secondary font-medium mb-1">{label}</p>
          <p className={`text-[28px] font-bold leading-none ${valueColor}`}>{value}</p>
          {sub && <p className="text-[13px] text-kameti-text-muted mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
