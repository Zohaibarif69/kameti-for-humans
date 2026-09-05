'use client';

import React, { useState } from 'react';
import { Search, UsersRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/mocks/data';
import type { Member } from '@/types';
import Drawer from '@/components/ui/Drawer';
import { CheckCircle, Clock, TriangleAlert, Circle } from 'lucide-react';
import MemberFormModal from '@/components/forms/MemberFormModal';

function MemberDetailDrawer({ member, onClose, onEdit }: { member: Member | null; onClose: () => void; onEdit: (member: Member) => void }) {
  if (!member) return null;
  const statusLabel: Record<string, string> = { paid: 'Paid', late: 'Late', missed: 'Missed', pending: 'Pending' };
  return (
    <Drawer open={!!member} onClose={onClose} title={member.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-5 border-b border-kameti-border">
          <div className="flex items-center gap-3">
            <Avatar name={member.name} size="lg" />
            <div>
              <p className="text-[16px] font-semibold text-kameti-text">{member.name}</p>
              <p className="text-[13px] text-kameti-text-muted">Member since {member.memberSince}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onEdit(member)}>Edit</Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Contribution', value: formatCurrency(member.contribution) },
            { label: 'Cycles', value: member.cyclesCompleted },
            { label: 'On time', value: member.onTimeCount },
            { label: 'Late', value: member.lateCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-kameti-bg rounded-lg p-3">
              <p className="text-[11px] text-kameti-text-muted mb-1">{label}</p>
              <p className="text-[16px] font-bold text-kameti-text">{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-kameti-text mb-3">Payment history</p>
          <div className="space-y-2">
            {member.paymentHistory.map(h => (
              <div key={h.cycleNumber} className="flex items-center justify-between py-2 border-b border-kameti-border last:border-0">
                <span className="text-[13px] text-kameti-text-secondary">Cycle {h.cycleNumber}</span>
                <div className="flex items-center gap-2">
                  {h.status === 'paid' && <CheckCircle size={14} className="text-success" />}
                  {h.status === 'late' && <Clock size={14} className="text-warning" />}
                  {h.status === 'missed' && <TriangleAlert size={14} className="text-danger" />}
                  {h.status === 'pending' && <Circle size={14} className="text-kameti-text-muted" />}
                  <span className={`text-[13px] font-medium ${h.status === 'paid' ? 'text-success' : h.status === 'late' ? 'text-warning' : h.status === 'missed' ? 'text-danger' : 'text-kameti-text-muted'}`}>
                    {statusLabel[h.status]}
                  </span>
                  {h.date && <span className="text-[12px] text-kameti-text-muted">{h.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function MembersPage() {
  const { members, committees } = useApp();
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);

  const allMembers = Object.entries(members).flatMap(([committeeId, mems]) => {
    const committee = committees.find(c => c.id === committeeId);
    return mems.map(m => ({ ...m, committeeName: committee?.name || '' }));
  });

  const filtered = allMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.committeeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-[24px] font-bold text-kameti-text">Members</h2>
        <p className="text-[14px] text-kameti-text-secondary mt-1">All members across your committees.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kameti-text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-9 pr-3 py-2 border border-kameti-border rounded-lg text-[14px] placeholder-kameti-text-muted bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UsersRound size={22} />} title="No members found" description="Try adjusting your search." />
      ) : (
        <div className="bg-white rounded-xl border border-kameti-border overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-kameti-bg border-b border-kameti-border text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide">
            <span>Name</span><span>Committee</span><span>Contribution</span><span>Reliability</span><span>Status</span>
          </div>
          {filtered.map((m, i) => (
            <button key={`${m.committeeId}-${m.id}`} onClick={() => setSelectedMember(m)}
              className={`w-full text-left grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-4 py-3 hover:bg-kameti-bg transition-colors ${i > 0 ? 'border-t border-kameti-border' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size="sm" />
                <span className="text-[14px] font-medium text-kameti-text">{m.name}</span>
              </div>
              <span className="text-[13px] text-kameti-text-secondary">{(m as any).committeeName}</span>
              <span className="text-[14px] text-kameti-text">{formatCurrency(m.contribution)}</span>
              <span className="text-[13px] text-kameti-text-muted">{m.onTimeCount}/{m.paymentHistory.length} on time</span>
              <Badge status={m.currentStatus} />
            </button>
          ))}
        </div>
      )}

      <MemberDetailDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={(m) => {
          setSelectedMember(null);
          setEditMember(m);
        }}
      />
      <MemberFormModal open={!!editMember} onClose={() => setEditMember(null)} member={editMember} />
    </div>
  );
}
