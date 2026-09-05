'use client';

import React from 'react';
import Link from 'next/link';
import { CircleDollarSign, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/mocks/data';

export default function PaymentsPage() {
  const { payments, committees } = useApp();

  const allPayments = Object.entries(payments).flatMap(([committeeId, payments]) => {
    const committee = committees.find(c => c.id === committeeId);
    return payments.map(p => ({ ...p, committeeName: committee?.name || '' }));
  });

  const overdue = allPayments.filter(p => p.status === 'overdue');
  const recent = allPayments.filter(p => p.status === 'paid').slice(0, 10);

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8">
      <div>
        <h2 className="text-[24px] font-bold text-kameti-text">Payments</h2>
        <p className="text-[14px] text-kameti-text-secondary mt-1">Track contributions across all your committees.</p>
      </div>

      {overdue.length > 0 && (
        <div>
          <h3 className="text-[15px] font-semibold text-kameti-text mb-3">Requires attention</h3>
          <div className="space-y-2">
            {overdue.map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-warning-bg border border-warning/20 rounded-xl px-4 py-3">
                <Avatar name={p.memberName} size="sm" />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-kameti-text">{p.memberName}</p>
                  <p className="text-[12px] text-kameti-text-muted">{p.committeeName}</p>
                </div>
                <span className="text-[14px] font-medium text-kameti-text">{formatCurrency(p.expectedAmount)}</span>
                <Badge status={p.status} />
                <Link href={`/committees/${p.committeeId}`} className="text-kameti-text-muted hover:text-primary transition-colors">
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-[15px] font-semibold text-kameti-text mb-3">Recent payments</h3>
        <div className="bg-white rounded-xl border border-kameti-border overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
          {recent.length === 0 ? (
            <EmptyState icon={<CircleDollarSign size={22} />} title="All payments are up to date" description="No members currently need attention." />
          ) : (
            recent.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-kameti-bg transition-colors ${i > 0 ? 'border-t border-kameti-border' : ''}`}>
                <Avatar name={p.memberName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-kameti-text">{p.memberName}</p>
                  <p className="text-[12px] text-kameti-text-muted">{p.committeeName}</p>
                </div>
                <span className="text-[14px] font-medium text-kameti-text">{p.receivedAmount ? formatCurrency(p.receivedAmount) : '—'}</span>
                <Badge status={p.status} />
                <span className="text-[12px] text-kameti-text-muted hidden sm:block">{p.submittedAt ? p.submittedAt.split(',')[0] : ''}</span>
                <Link href={`/committees/${p.committeeId}`} className="text-kameti-text-muted hover:text-primary transition-colors">
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
