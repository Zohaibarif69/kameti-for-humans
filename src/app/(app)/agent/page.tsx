'use client';

import React from 'react';
import { Bot, CheckCircle2, TriangleAlert, Clock, RefreshCw, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatTime } from '@/mocks/data';
import type { AgentAction } from '@/types';

function AgentStatusHero() {
  const { agentStatus } = useApp();
  return (
    <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-6" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <Bot size={24} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-success status-dot-active" />
            <span className="text-[15px] sm:text-[16px] font-bold text-kameti-text uppercase tracking-wide">Active</span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary">
            Monitoring {agentStatus.monitoringCommittee} and 2 other committees
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[12px] text-kameti-text-muted">Last checked</p>
          <p className="text-[14px] font-semibold text-kameti-text">{agentStatus.lastChecked}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityEntry({ action, isLast }: { action: AgentAction; isLast: boolean }) {
  const isWarning = action.severity === 'warning' || action.severity === 'error';
  const isSuccess = action.severity === 'success';
  const dotColor = isWarning ? 'bg-warning' : isSuccess ? 'bg-success' : 'bg-info';

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5`} />
        {!isLast && <div className="w-px flex-1 bg-kameti-border mt-1" />}
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[12px] font-semibold text-kameti-text-muted">{formatTime(action.timestamp)}</p>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            isWarning ? 'bg-warning-bg text-warning' :
            isSuccess ? 'bg-success-bg text-success' :
            'bg-info-bg text-info'
          }`}>
            {isWarning ? 'Decision needed' : isSuccess ? 'Completed' : 'Info'}
          </span>
        </div>
        <p className={`text-[14px] font-semibold mb-0.5 ${isWarning ? 'text-warning' : 'text-kameti-text'}`}>{action.title}</p>
        <p className="text-[13px] text-kameti-text-secondary">{action.description}</p>
        {action.why && (
          <div className="mt-2 bg-kameti-bg border border-kameti-border rounded-lg px-3 py-2">
            <p className="text-[12px] text-kameti-text-muted">
              <span className="font-medium">Why: </span>{action.why}
            </p>
          </div>
        )}
        {action.outcome && (
          <p className="text-[12px] text-kameti-text-muted mt-1.5">
            <span className="font-medium">Outcome: </span>{action.outcome}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AgentPage() {
  const { agentActivity, agentStatus, runAgentCheck } = useApp();
  const [isRunning, setIsRunning] = React.useState(false);

  const handleRefresh = async () => {
    setIsRunning(true);
    try {
      await runAgentCheck();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[900px] mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-[20px] sm:text-[24px] font-bold text-kameti-text">Kameti Agent</h2>
        <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary mt-1">Your autonomous committee coordinator.</p>
      </div>

      <AgentStatusHero />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Actions today" value={agentStatus.actionsToday} sub="Automated" icon={<CheckCircle2 size={18} />} variant="success" />
        <StatCard label="Reminders sent" value={5} sub="Via WhatsApp" icon={<MessageCircle size={18} />} />
        <StatCard label="Payments verified" value={7} sub="This cycle" icon={<CheckCircle2 size={18} />} />
        <StatCard label="Human decisions" value={agentStatus.humanDecisions} sub={agentStatus.humanDecisions > 0 ? 'Needs attention' : 'None needed'} icon={<TriangleAlert size={18} />} variant={agentStatus.humanDecisions > 0 ? 'warning' : 'default'} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] sm:text-[16px] font-semibold text-kameti-text">Agent activity</h3>
          <button
            onClick={handleRefresh}
            disabled={isRunning}
            className="flex items-center gap-1.5 text-[13px] text-kameti-text-secondary hover:text-kameti-text transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRunning ? 'animate-spin' : ''} /> {isRunning ? 'Running…' : 'Run agent check'}
          </button>
        </div>

        {agentActivity.length === 0 ? (
          <EmptyState icon={<Bot size={22} />} title="No activity yet" description="Agent actions will appear here as your committee becomes active." />
        ) : (
          <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-6" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
            <p className="text-[12px] font-semibold text-kameti-text-muted uppercase tracking-wide mb-5">Today — Sep 11, 2026</p>
            {agentActivity.map((action, i) => (
              <ActivityEntry key={action.id} action={action} isLast={i === agentActivity.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
