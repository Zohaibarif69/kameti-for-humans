import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-kameti-surface-2 rounded skeleton-animate ${className}`} />;
}

export default function Skeleton({ className = '', lines = 3 }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-4 ${i === 0 ? 'w-3/4' : i % 2 === 0 ? 'w-full' : 'w-5/6'}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-kameti-border p-6 space-y-4" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
      <div className="flex items-center gap-3">
        <SkeletonLine className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/2" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonLine className="h-2 w-full rounded-full" />
      <div className="flex gap-4">
        <SkeletonLine className="h-3 w-1/3" />
        <SkeletonLine className="h-3 w-1/3" />
      </div>
    </div>
  );
}
