import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-kameti-text mb-2">{title}</h3>
      {description && <p className="text-[13px] text-kameti-text-secondary max-w-xs leading-relaxed mb-6">{description}</p>}
      {action}
    </div>
  );
}
