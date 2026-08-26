'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  CheckCircle2,
  Circle,
  TriangleAlert,
  Clock,
  Upload,
  Plus,
  ChevronRight,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Avatar from '@/components/ui/Avatar';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import Input, { Select } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import CommitteeFormModal from '@/components/forms/CommitteeFormModal';
import MemberFormModal from '@/components/forms/MemberFormModal';
import { formatCurrency, formatTime } from '@/mocks/data';
import type { Payment, Member } from '@/types';

// ── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentStatusIcon({ status }: { status: Payment['status'] }) {
  if (status === 'paid') return <CheckCircle size={15} className="text-success" />;
  if (status === 'overdue') return <TriangleAlert size={15} className="text-warning" />;
  if (status === 'under_review') return <Clock size={15} className="text-info" />;
  if (status === 'disputed') return <TriangleAlert size={15} className="text-danger" />;
  return <Circle size={15} className="text-kameti-text-muted" />;
}

function PaymentDetailDrawer({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  if (!payment) return null;

  const steps = payment.status === 'paid' ? [
    { time: payment.submittedAt?.split(' at ')[1] || '', label: 'Receipt submitted' },
    { time: payment.submittedAt?.split(' at ')[1] || '', label: 'Amount extracted' },
    { time: payment.submittedAt?.split(' at ')[1] || '', label: 'Amount matched expected contribution' },
    { time: payment.verifiedAt?.split(' at ')[1] || '', label: 'Payment confirmed' },
  ] : [];

  return (
    <Drawer open={!!payment} onClose={onClose} title="Payment details">
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-kameti-border">
          <Avatar name={payment.memberName} size="lg" />
          <div>
            <p className="text-[16px] font-semibold text-kameti-text">{payment.memberName}</p>
            <p className="text-[13px] text-kameti-text-muted">Cycle 4</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Expected', value: formatCurrency(payment.expectedAmount) },
            { label: 'Received', value: payment.receivedAmount ? formatCurrency(payment.receivedAmount) : '—' },
            { label: 'Status', value: <Badge status={payment.status} /> },
            { label: 'Submitted', value: payment.submittedAt || '—' },
            { label: 'Reference', value: payment.reference || '—' },
            { label: 'Verified by', value: payment.verifiedBy || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[13px] text-kameti-text-muted">{label}</span>
              <span className="text-[13px] font-medium text-kameti-text text-right">{value}</span>
            </div>
          ))}
        </div>

        {steps.length > 0 && (
          <div>
            <p className="text-[13px] font-semibold text-kameti-text mb-3">Activity</p>
            <div className="space-y-2.5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <div>
                    <span className="text-[12px] font-semibold text-kameti-text-muted mr-2">{step.time}</span>
                    <span className="text-[13px] text-kameti-text">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {payment.notes && (
          <div className="bg-warning-bg border border-warning/20 rounded-lg p-3">
            <p className="text-[12px] font-semibold text-warning mb-1">Agent note</p>
            <p className="text-[13px] text-kameti-text-secondary">{payment.notes}</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function AddPaymentModal({ open, onClose, committeeId, members }: { open: boolean; onClose: () => void; committeeId: string; members: Member[] }) {
  const { addPayment } = useApp();
  const [form, setForm] = useState({ memberId: '', amount: '25000', method: 'bank_transfer', analyzing: false, analyzed: false });

  const handleSubmit = async () => {
    setForm(p => ({ ...p, analyzing: true }));
    await new Promise(r => setTimeout(r, 1500));
    setForm(p => ({ ...p, analyzing: false, analyzed: true }));
  };

  const handleConfirm = () => {
    const member = members.find(m => m.id === form.memberId);
    addPayment(committeeId, {
      memberId: form.memberId,
      memberName: member?.name || '',
      expectedAmount: parseInt(form.amount),
      receivedAmount: parseInt(form.amount),
      method: form.method,
    });
    setForm({ memberId: '', amount: '25000', method: 'bank_transfer', analyzing: false, analyzed: false });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Record payment" size="md"
      footer={
        !form.analyzed ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" loading={form.analyzing} onClick={handleSubmit}>
              {form.analyzing ? 'Analyzing...' : 'Submit payment'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirm}>Confirm payment</Button>
          </>
        )
      }
    >
      {!form.analyzed ? (
        <div className="space-y-4">
          <Select label="Member" value={form.memberId} onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))} options={[{ value: '', label: 'Select member' }, ...members.map(m => ({ value: m.id, label: m.name }))]} />
          <Input label="Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} prefix={<span className="text-[13px]">Rs.</span>} type="number" />
          <Select label="Payment method" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} options={[{ value: 'bank_transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'easypaisa', label: 'EasyPaisa' }, { value: 'jazzcash', label: 'JazzCash' }]} />
          <div>
            <label className="text-[13px] font-medium text-kameti-text block mb-1.5">Receipt</label>
            <div className="border-2 border-dashed border-kameti-border rounded-xl p-6 sm:p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <Upload size={22} className="text-kameti-text-muted mx-auto mb-2" />
              <p className="text-[13px] font-medium text-kameti-text-secondary">Upload receipt</p>
              <p className="text-[12px] text-kameti-text-muted mt-0.5">PNG, JPG or PDF</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-success-bg border border-success/20 rounded-lg p-4">
            <p className="text-[13px] font-semibold text-success mb-3">Receipt analyzed</p>
            <div className="space-y-2">
              {['Amount detected', 'Date detected', 'Reference detected'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span className="text-[13px] text-kameti-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-kameti-text-muted">Detected amount</span>
              <span className="font-semibold text-kameti-text">Rs. {form.amount}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-kameti-text-muted">Expected amount</span>
              <span className="font-semibold text-success">Rs. {form.amount}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function PaymentsTab({ committeeId }: { committeeId: string }) {
  const { payments, members } = useApp();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const committeePayments = payments[committeeId] || [];
  const committeeMembers = members[committeeId] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] text-kameti-text-secondary">Current cycle payments</p>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
          Add payment
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-kameti-border overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-kameti-bg border-b border-kameti-border text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide">
          <span>Member</span><span>Amount</span><span>Status</span><span>Date</span><span />
        </div>
        {committeePayments.length === 0 ? (
          <EmptyState title="No payments yet" description="Payments will appear here as members contribute." />
        ) : (
          committeePayments.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelectedPayment(p)}
              className={`w-full text-left flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-4 py-3 hover:bg-kameti-bg transition-colors ${i > 0 ? 'border-t border-kameti-border' : ''}`}
            >
              {/* Mobile layout: avatar + name + badge + chevron */}
              <div className="flex items-center gap-3 flex-1 sm:contents">
                <Avatar name={p.memberName} size="sm" />
                <div className="flex-1 min-w-0 sm:hidden">
                  <p className="text-[14px] font-medium text-kameti-text">{p.memberName}</p>
                  <p className="text-[12px] text-kameti-text-muted">{p.receivedAmount ? formatCurrency(p.receivedAmount) : '—'}</p>
                </div>
                {/* Desktop avatar+name cell */}
                <span className="hidden sm:flex items-center gap-3">
                  <span className="text-[14px] font-medium text-kameti-text">{p.memberName}</span>
                </span>
              </div>
              <span className="hidden sm:block text-[14px] text-kameti-text">{p.receivedAmount ? formatCurrency(p.receivedAmount) : '—'}</span>
              <div className="hidden sm:flex items-center gap-1.5">
                <PaymentStatusIcon status={p.status} />
                <Badge status={p.status} />
              </div>
              {/* Mobile status badge */}
              <Badge status={p.status} className="sm:hidden shrink-0" />
              <span className="hidden sm:block text-[13px] text-kameti-text-muted">{p.submittedAt ? p.submittedAt.split(',')[0] : '—'}</span>
              <ChevronRight size={15} className="text-kameti-text-muted shrink-0" />
            </button>
          ))
        )}
      </div>
      <PaymentDetailDrawer payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      <AddPaymentModal open={addOpen} onClose={() => setAddOpen(false)} committeeId={committeeId} members={committeeMembers} />
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MemberDrawer({ member, onClose, onEdit }: { member: Member | null; onClose: () => void; onEdit: (member: Member) => void }) {
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
          <div className="space-y-0 divide-y divide-kameti-border">
            {member.paymentHistory.map(h => (
              <div key={h.cycleNumber} className="flex items-center justify-between py-2.5">
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

function MembersTab({ committeeId }: { committeeId: string }) {
  const { members } = useApp();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const committeeMembers = members[committeeId] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] text-kameti-text-secondary">{committeeMembers.length} members</p>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setAddMemberOpen(true)}>
          Add member
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-kameti-border overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
        <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-4 py-3 bg-kameti-bg border-b border-kameti-border text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide">
          <span>Name</span><span>Contribution</span><span>History</span><span>Status</span>
        </div>
        {committeeMembers.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setSelectedMember(m)}
            className={`w-full text-left flex sm:grid sm:grid-cols-[2fr_1fr_2fr_1fr] gap-3 sm:gap-4 items-center px-4 py-3 hover:bg-kameti-bg transition-colors ${i > 0 ? 'border-t border-kameti-border' : ''}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0">
                <span className="text-[14px] font-medium text-kameti-text block truncate">{m.name}</span>
                <span className="text-[12px] text-kameti-text-muted sm:hidden">{m.onTimeCount}/{m.paymentHistory.length} on time</span>
              </div>
            </div>
            <span className="hidden sm:block text-[14px] text-kameti-text">{formatCurrency(m.contribution)}</span>
            <span className="hidden sm:block text-[13px] text-kameti-text-muted">{m.onTimeCount}/{m.paymentHistory.length} on time</span>
            <Badge status={m.currentStatus} />
          </button>
        ))}
      </div>

      <MemberDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={(m) => {
          setSelectedMember(null);
          setEditMember(m);
        }}
      />

      <MemberFormModal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} committeeId={committeeId} />
      <MemberFormModal open={!!editMember} onClose={() => setEditMember(null)} member={editMember} />
    </div>
  );
}

// ── Rotation Tab ──────────────────────────────────────────────────────────────

function RotationTab({ committeeId }: { committeeId: string }) {
  const { rotation } = useApp();
  const entries = rotation[committeeId] || [];

  return (
    <div className="space-y-2.5">
      <p className="text-[14px] text-kameti-text-secondary mb-4">Payout rotation</p>
      {entries.map(entry => (
        <div
          key={entry.cycleNumber}
          className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
            entry.status === 'current' ? 'bg-primary-light border-primary/20' :
            entry.status === 'completed' ? 'bg-white border-kameti-border' :
            'bg-kameti-surface-2 border-kameti-border'
          }`}
        >
          <div className="flex items-center justify-center w-6 sm:w-8 shrink-0">
            {entry.status === 'completed' && <CheckCircle2 size={18} className="text-success" />}
            {entry.status === 'current' && <div className="w-3 h-3 rounded-full bg-primary status-dot-active" />}
            {entry.status === 'upcoming' && <Circle size={18} className="text-kameti-border" />}
          </div>
          <div className="w-10 sm:w-12 shrink-0">
            <p className={`text-[11px] sm:text-[12px] font-semibold ${entry.status === 'current' ? 'text-primary' : 'text-kameti-text-muted'}`}>
              Cycle {entry.cycleNumber}
            </p>
          </div>
          <Avatar name={entry.memberName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] font-semibold truncate ${entry.status === 'upcoming' ? 'text-kameti-text-secondary' : 'text-kameti-text'}`}>{entry.memberName}</p>
            {(entry.status === 'completed' || entry.status === 'current') && (
              <p className="text-[12px] text-kameti-text-muted">{formatCurrency(entry.amount)}</p>
            )}
          </div>
          <div className="shrink-0">
            {entry.status === 'completed' && <span className="hidden sm:block text-[12px] text-success font-medium">Done · {entry.date}</span>}
            {entry.status === 'completed' && <CheckCircle2 size={15} className="sm:hidden text-success" />}
            {entry.status === 'current' && <span className="text-[11px] sm:text-[12px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current</span>}
            {entry.status === 'upcoming' && <span className="text-[11px] sm:text-[12px] text-kameti-text-muted">Upcoming</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

function ActivityTab({ committeeId }: { committeeId: string }) {
  const { agentActivity } = useApp();
  const activities = agentActivity.filter(a => a.committeeId === committeeId);

  if (activities.length === 0) {
    return <EmptyState icon={<Clock size={22} />} title="No activity yet" description="Agent actions will appear here as your committee becomes active." />;
  }

  return (
    <div>
      <p className="text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide mb-4">Today</p>
      {activities.map((action, i) => {
        const isWarning = action.severity === 'warning';
        const isSuccess = action.severity === 'success';
        const dotColor = isWarning ? 'bg-warning' : isSuccess ? 'bg-success' : 'bg-info';
        const isLast = i === activities.length - 1;

        return (
          <div key={action.id} className="flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5`} />
              {!isLast && <div className="w-px flex-1 bg-kameti-border mt-1" />}
            </div>
            <div className="pb-5 flex-1 min-w-0">
              <p className="text-[12px] text-kameti-text-muted mb-1">{formatTime(action.timestamp)}</p>
              <p className={`text-[14px] font-semibold ${isWarning ? 'text-warning' : 'text-kameti-text'}`}>{action.title}</p>
              <p className="text-[13px] text-kameti-text-secondary mt-0.5">{action.description}</p>
              {action.why && (
                <div className="mt-2 bg-kameti-bg rounded-lg px-3 py-2">
                  <p className="text-[12px] text-kameti-text-muted">Why: {action.why}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ committeeId }: { committeeId: string }) {
  const { committees } = useApp();
  const committee = committees.find(c => c.id === committeeId);
  if (!committee) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-6" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold text-kameti-text-muted uppercase tracking-wide mb-1">Current Cycle</p>
            <p className="text-[22px] sm:text-[28px] font-bold text-kameti-text">Cycle {committee.currentCycle} of {committee.totalCycles}</p>
          </div>
          <Badge status={committee.status === 'active' ? 'on_track' : committee.status} />
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-[13px] mb-2">
            <span className="text-kameti-text-secondary">{committee.paymentsReceived} of {committee.memberCount} paid</span>
            <span className="font-semibold text-kameti-text">{formatCurrency(committee.potCollected)}</span>
          </div>
          <ProgressBar value={committee.potCollected} max={committee.potExpected} />
          <div className="flex justify-between text-[12px] mt-1">
            <span className="text-kameti-text-muted">Collected</span>
            <span className="text-kameti-text-muted">of {formatCurrency(committee.potExpected)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-kameti-border">
          <div>
            <p className="text-[11px] text-kameti-text-muted uppercase tracking-wide mb-1">Next recipient</p>
            <p className="text-[14px] font-semibold text-kameti-text">{committee.nextRecipientName}</p>
          </div>
          <div>
            <p className="text-[11px] text-kameti-text-muted uppercase tracking-wide mb-1">Deadline</p>
            <div className="flex items-center gap-1.5">
              <CalendarDays size={13} className="text-kameti-text-muted shrink-0" />
              <p className="text-[13px] sm:text-[14px] font-semibold text-kameti-text">{committee.deadline}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-kameti-border">
          <div className="w-2 h-2 rounded-full bg-primary status-dot-active shrink-0" />
          <p className="text-[13px] text-kameti-text-secondary">Kameti is monitoring this cycle</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'payments' | 'members' | 'rotation' | 'activity';

export default function CommitteeDetailPage() {
  const { committeeId } = useParams<{ committeeId: string }>();
  const { committees } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [manageOpen, setManageOpen] = useState(false);

  const committee = committees.find(c => c.id === committeeId);

  if (!committee) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link href="/committees" className="flex items-center gap-2 text-[13px] text-kameti-text-secondary hover:text-kameti-text mb-4">
          <ArrowLeft size={15} /> Committees
        </Link>
        <p className="text-kameti-text-muted">Committee not found.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Payments' },
    { id: 'members', label: 'Members' },
    { id: 'rotation', label: 'Rotation' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1000px] mx-auto">
      {/* Back */}
      <Link href="/committees" className="flex items-center gap-1.5 text-[13px] text-kameti-text-muted hover:text-kameti-text transition-colors mb-4 sm:mb-6">
        <ArrowLeft size={15} /> Committees
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-kameti-text leading-tight">{committee.name}</h2>
          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
            <span className="text-[12px] sm:text-[13px] text-kameti-text-muted">{committee.memberCount} members</span>
            <span className="text-kameti-border hidden sm:inline">·</span>
            <span className="text-[12px] sm:text-[13px] text-kameti-text-muted hidden sm:inline">{formatCurrency(committee.contributionAmount)} / {committee.frequency}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="hidden sm:flex">More</Button>
          <Button variant="primary" size="sm" onClick={() => setManageOpen(true)}>
            <span className="hidden sm:inline">Manage committee</span>
            <span className="sm:hidden">Manage</span>
          </Button>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-0.5 bg-kameti-surface-2 rounded-lg p-1 mb-5 sm:mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[72px] px-3 sm:px-4 py-2 rounded-md text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-kameti-text shadow-sm'
                : 'text-kameti-text-secondary hover:text-kameti-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab committeeId={committee.id} />}
      {activeTab === 'payments' && <PaymentsTab committeeId={committee.id} />}
      {activeTab === 'members' && <MembersTab committeeId={committee.id} />}
      {activeTab === 'rotation' && <RotationTab committeeId={committee.id} />}
      {activeTab === 'activity' && <ActivityTab committeeId={committee.id} />}

      <CommitteeFormModal open={manageOpen} onClose={() => setManageOpen(false)} committee={committee} />
    </div>
  );
}
