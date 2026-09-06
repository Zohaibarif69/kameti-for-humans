'use client';

import React, { useState } from 'react';
import { CheckCircle, TriangleAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime } from '@/mocks/data';
import type { Decision } from '@/types';

const decisionActions = [
  { value: 'wait_24h', label: 'Wait 24 hours' },
  { value: 'send_reminder', label: 'Send another reminder' },
  { value: 'mark_delayed', label: 'Mark cycle as delayed' },
  { value: 'other', label: 'Other' },
];

function DecisionCard({ decision }: { decision: Decision }) {
  const { approveDecision, resolveDecision } = useApp();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('wait_24h');
  const [otherText, setOtherText] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmApprove = () => {
    approveDecision(decision.id, decision.recommendation);
    setConfirmOpen(false);
  };

  const handleResolve = () => {
    const action = decisionActions.find(a => a.value === selectedAction);
    const resolution = selectedAction === 'other' ? otherText : action?.label || selectedAction;
    resolveDecision(decision.id, resolution, resolution);
    setActionModalOpen(false);
  };

  const isResolved = decision.status !== 'pending';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${isResolved ? 'border-success/20' : 'border-warning/30'}`} style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
      {/* Card header */}
      <div className={`px-4 sm:px-5 py-3 sm:py-4 border-b ${isResolved ? 'bg-success-bg border-success/15' : 'bg-warning-bg border-warning/15'}`}>
        <div className="flex items-center gap-2">
          {isResolved ? <CheckCircle size={16} className="text-success" /> : <TriangleAlert size={16} className="text-warning" />}
          <span className={`text-[13px] font-semibold ${isResolved ? 'text-success' : 'text-warning'}`}>
            {isResolved ? 'Decision resolved' : 'Decision required'}
          </span>
          <span className="ml-auto text-[12px] text-kameti-text-muted">{formatRelativeTime(decision.createdAt)}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <p className="text-[12px] text-kameti-text-muted font-medium mb-1">{decision.committeeName} — Cycle {decision.cycleNumber}</p>
          <p className="text-[15px] sm:text-[16px] font-semibold text-kameti-text">{decision.title}</p>
          <p className="text-[13px] text-kameti-text-secondary mt-2 leading-relaxed">{decision.description}</p>
        </div>

        <div className="bg-primary-light border border-primary/15 rounded-lg p-3 sm:p-4">
          <p className="text-[12px] font-semibold text-primary mb-1">Agent recommendation</p>
          <p className="text-[13px] text-primary-dark">{decision.recommendation}</p>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-kameti-text mb-3">Evidence</p>
          <div className="space-y-2">
            {decision.evidence.latePayments !== undefined && (
              <div className="flex justify-between">
                <span className="text-[13px] text-kameti-text-muted">Previous late payments</span>
                <span className="text-[13px] font-medium text-kameti-text">{decision.evidence.latePayments}</span>
              </div>
            )}
            {decision.evidence.currentContribution !== undefined && (
              <div className="flex justify-between">
                <span className="text-[13px] text-kameti-text-muted">Current contribution</span>
                <span className="text-[13px] font-medium text-kameti-text">{formatCurrency(decision.evidence.currentContribution)}</span>
              </div>
            )}
            {decision.evidence.currentPot !== undefined && decision.evidence.expectedPot !== undefined && (
              <div className="flex justify-between">
                <span className="text-[13px] text-kameti-text-muted">Current pot</span>
                <span className="text-[13px] font-medium text-kameti-text">{formatCurrency(decision.evidence.currentPot)} / {formatCurrency(decision.evidence.expectedPot)}</span>
              </div>
            )}
          </div>
        </div>

        {isResolved && decision.resolution && (
          <div className="bg-success-bg border border-success/15 rounded-lg p-3">
            <p className="text-[12px] font-semibold text-success mb-1">Resolution</p>
            <p className="text-[13px] text-kameti-text">{decision.resolution}</p>
          </div>
        )}

        {!isResolved && (
          <div className="flex flex-col gap-2 pt-2 border-t border-kameti-border">
            <Button variant="primary" size="lg" className="w-full justify-center" onClick={() => setConfirmOpen(true)}>
              Approve recommendation
            </Button>
            <Button variant="secondary" size="lg" className="w-full justify-center" onClick={() => setActionModalOpen(true)}>
              Choose another action
            </Button>
          </div>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm decision" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmApprove}>Confirm decision</Button>
          </>
        }
      >
        <p className="text-[14px] text-kameti-text-secondary">
          You are approving: <strong className="text-kameti-text">{decision.recommendation}</strong>
        </p>
        <p className="text-[13px] text-kameti-text-muted mt-3">Kameti will proceed with this action.</p>
      </Modal>

      <Modal open={actionModalOpen} onClose={() => setActionModalOpen(false)} title="What should Kameti do?" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResolve} disabled={selectedAction === 'other' && !otherText.trim()}>
              Confirm decision
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {decisionActions.map(action => (
            <label key={action.value} className="flex items-center gap-3 p-3 rounded-lg border border-kameti-border hover:bg-kameti-bg cursor-pointer transition-colors">
              <input type="radio" name="decision_action" value={action.value} checked={selectedAction === action.value} onChange={() => setSelectedAction(action.value)} className="text-primary" />
              <span className="text-[14px] text-kameti-text">{action.label}</span>
            </label>
          ))}
          {selectedAction === 'other' && (
            <div className="mt-2">
              <label className="text-[13px] font-medium text-kameti-text block mb-1.5">Tell Kameti what you want to do</label>
              <textarea
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                className="w-full border border-kameti-border rounded-lg text-[14px] text-kameti-text p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
                rows={3}
                placeholder="Describe the action..."
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function DecisionsPage() {
  const { decisions } = useApp();
  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const resolvedDecisions = decisions.filter(d => d.status !== 'pending');

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[800px] mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-[20px] sm:text-[24px] font-bold text-kameti-text">Decisions</h2>
        <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary mt-1">Things Kameti needs you to decide.</p>
      </div>

      {pendingDecisions.length === 0 ? (
        <div className="bg-success-bg border border-success/20 rounded-xl p-5 sm:p-6 flex items-center gap-4">
          <CheckCircle size={22} className="text-success shrink-0" />
          <div>
            <p className="text-[15px] font-semibold text-success">No decisions needed</p>
            <p className="text-[13px] text-kameti-text-secondary mt-0.5">Kameti is handling everything automatically.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-warning text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {pendingDecisions.length}
            </span>
            <h3 className="text-[15px] font-semibold text-kameti-text">
              {pendingDecisions.length} decision{pendingDecisions.length !== 1 ? 's' : ''} needed
            </h3>
          </div>
          {pendingDecisions.map(d => <DecisionCard key={d.id} decision={d} />)}
        </div>
      )}

      {resolvedDecisions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold text-kameti-text-secondary">Recently resolved</h3>
          {resolvedDecisions.map(d => <DecisionCard key={d.id} decision={d} />)}
        </div>
      )}
    </div>
  );
}
