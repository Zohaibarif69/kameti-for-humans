'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UsersRound, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import CommitteeFormModal from '@/components/forms/CommitteeFormModal';
import { formatCurrency } from '@/mocks/data';
import type { CommitteeStatus } from '@/types';

type Filter = 'all' | CommitteeStatus;


export default function CommitteesPage() {
  const { committees } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Attention', value: 'needs_attention' },
    { label: 'Done', value: 'completed' },
  ];

  const filtered = committees.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 sm:mb-6">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-bold text-kameti-text">Committees</h2>
          <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary mt-0.5">Manage and monitor your savings circles.</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)} className="shrink-0">
          <span className="hidden sm:inline">New committee</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kameti-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search committees..."
            className="w-full pl-9 pr-3 py-2 border border-kameti-border rounded-lg text-[14px] text-kameti-text placeholder-kameti-text-muted bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-white border border-kameti-border rounded-lg p-1 overflow-x-auto shrink-0">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary-light text-primary-dark'
                  : 'text-kameti-text-secondary hover:text-kameti-text hover:bg-kameti-surface-2'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Committee list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={22} />}
          title="No committees yet"
          description="Create your first savings circle and let Kameti handle the coordination."
          action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create committee</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-4 px-4 text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide">
            <span>Committee</span>
            <span>Members</span>
            <span>Cycle</span>
            <span>Progress</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map(c => (
            <Link key={c.id} href={`/committees/${c.id}`} className="block">
              <div className="bg-white rounded-xl border border-kameti-border hover:border-primary/30 hover:shadow-md transition-all duration-150" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
                {/* Desktop row */}
                <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-4 items-center px-4 py-4">
                  <div>
                    <p className="text-[14px] font-semibold text-kameti-text">{c.name}</p>
                    <p className="text-[12px] text-kameti-text-muted">{formatCurrency(c.contributionAmount)} / {c.frequency}</p>
                  </div>
                  <span className="text-[14px] text-kameti-text">{c.memberCount}</span>
                  <span className="text-[14px] text-kameti-text">{c.currentCycle} of {c.totalCycles}</span>
                  <div className="space-y-1">
                    <ProgressBar value={c.paymentsReceived} max={c.memberCount} size="sm" />
                    <p className="text-[12px] text-kameti-text-muted">{c.paymentsReceived}/{c.memberCount}</p>
                  </div>
                  <Badge status={c.status === 'active' ? 'on_track' : c.status} />
                  <ArrowRight size={16} className="text-kameti-text-muted" />
                </div>

                {/* Tablet row */}
                <div className="hidden sm:grid lg:hidden grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 items-center px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-kameti-text">{c.name}</p>
                    <p className="text-[12px] text-kameti-text-muted">Cycle {c.currentCycle}/{c.totalCycles}</p>
                  </div>
                  <span className="text-[13px] text-kameti-text-muted">{c.memberCount} members</span>
                  <div className="space-y-1">
                    <ProgressBar value={c.paymentsReceived} max={c.memberCount} size="sm" />
                    <p className="text-[12px] text-kameti-text-muted">{c.paymentsReceived}/{c.memberCount}</p>
                  </div>
                  <Badge status={c.status === 'active' ? 'on_track' : c.status} />
                  <ArrowRight size={15} className="text-kameti-text-muted" />
                </div>

                {/* Mobile card */}
                <div className="sm:hidden p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[15px] font-semibold text-kameti-text">{c.name}</p>
                      <p className="text-[12px] text-kameti-text-muted mt-0.5">Cycle {c.currentCycle} of {c.totalCycles} · {c.memberCount} members</p>
                    </div>
                    <Badge status={c.status === 'active' ? 'on_track' : c.status} />
                  </div>
                  <ProgressBar value={c.paymentsReceived} max={c.memberCount} size="sm" />
                  <div className="flex justify-between text-[13px]">
                    <span className="text-kameti-text-secondary">{c.paymentsReceived}/{c.memberCount} paid</span>
                    <span className="font-medium text-kameti-text">{formatCurrency(c.potCollected)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CommitteeFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
