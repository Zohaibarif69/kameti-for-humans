'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  TriangleAlert,
  ArrowRight,
  Bot,
  CircleDollarSign,
  UsersRound,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatRelativeTime } from '@/mocks/data';
import type { Committee, AgentAction } from '@/types';

function ActionBanner() {
  const { decisions, committees } = useApp();
  const pendingDecision = decisions.find(d => d.status === 'pending');

  if (!pendingDecision) {
    return (
      <div className="flex items-start gap-3 p-4 bg-success-bg border border-success/20 rounded-xl">
        <CheckCircle size={18} className="text-success shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-semibold text-success">Everything is on track</p>
          <p className="text-[13px] text-kameti-text-secondary mt-0.5">
            Kameti is monitoring {committees.filter(c => c.status !== 'completed').length} committees. No action is required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 bg-warning-bg border border-warning/20 rounded-xl">
      <div className="flex items-start gap-3">
        <TriangleAlert size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-semibold text-warning">1 decision requires your attention</p>
          <p className="text-[13px] text-kameti-text-secondary mt-0.5">{pendingDecision.title}</p>
          <p className="text-[12px] text-kameti-text-muted mt-0.5">{pendingDecision.committeeName}</p>
        </div>
      </div>
      <Link href="/decisions" className="sm:shrink-0">
        <Button variant="secondary" size="sm" className="w-full sm:w-auto">Review decision</Button>
      </Link>
    </div>
  );
}

function CommitteeCard({ committee }: { committee: Committee }) {
  const isComplete = committee.status === 'completed';

  return (
    <Link href={`/committees/${committee.id}`} className="block">
      <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-5 hover:border-primary/30 hover:shadow-md transition-all duration-150" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-kameti-text truncate">{committee.name}</h3>
            <p className="text-[12px] text-kameti-text-muted mt-0.5">Cycle {committee.currentCycle} of {committee.totalCycles}</p>
          </div>
          <Badge status={committee.status === 'active' ? 'on_track' : committee.status} />
        </div>

        <ProgressBar value={committee.paymentsReceived} max={committee.memberCount} className="mb-3" />

        <div className="flex items-center justify-between text-[13px] mb-3">
          <span className="text-kameti-text-secondary">{committee.paymentsReceived} / {committee.memberCount} contributions</span>
          <span className="font-medium text-kameti-text">{formatCurrency(committee.potCollected)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-kameti-border pt-3">
          <div>
            <p className="text-[11px] text-kameti-text-muted">Next recipient</p>
            <p className="text-[13px] font-medium text-kameti-text">{committee.nextRecipientName}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]">
            {isComplete ? (
              <span className="flex items-center gap-1 text-success font-medium"><CheckCircle size={13} /> Complete</span>
            ) : (
              <span className="flex items-center gap-1 text-primary font-medium"><Bot size={13} /> Agent monitoring</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ action, isLast }: { action: AgentAction; isLast: boolean }) {
  const isWarning = action.severity === 'warning' || action.severity === 'error';
  const isSuccess = action.severity === 'success';
  const dotColor = isWarning ? 'bg-warning' : isSuccess ? 'bg-success' : 'bg-info';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5`} />
        {!isLast && <div className="w-px flex-1 bg-kameti-border mt-1.5" />}
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <span className="text-[12px] text-kameti-text-muted">{formatRelativeTime(action.timestamp)}</span>
        <p className={`text-[13px] font-semibold mt-0.5 ${isWarning ? 'text-warning' : 'text-kameti-text'}`}>{action.title}</p>
        <p className="text-[13px] text-kameti-text-secondary">{action.description}</p>
      </div>
    </div>
  );
}

function LiveAgentPanel() {
  const { agentStatus, refresh } = useApp();
  const [status, setStatus] = React.useState<'idle' | 'running' | 'error'>('idle');
  const [lines, setLines] = React.useState<string[]>([]);
  const [toolCalls, setToolCalls] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, toolCalls]);

  const handleRun = () => {
    setStatus('running');
    setLines([]);
    setToolCalls([]);

    // Native browser EventSource — every message here is a real, live event
    // forwarded from the agent as it actually reasons (see
    // src/app/api/agent/run-stream/route.ts and agent-service's
    // /api/run/stream). Nothing here is scripted or replayed.
    const source = new EventSource('/api/agent/run-stream');

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; text?: string; name?: string };
        if (payload.type === 'text' && payload.text) {
          setLines((prev) => [...prev, payload.text as string]);
        } else if (payload.type === 'tool_call' && payload.name) {
          setToolCalls((prev) => [...prev, payload.name as string]);
        } else if (payload.type === 'error' && payload.text) {
          setLines((prev) => [...prev, `⚠️ ${payload.text}`]);
        } else if (payload.type === 'done') {
          source.close();
          setStatus('idle');
          refresh();
        }
      } catch {
        // ignore malformed chunks rather than breaking the stream display
      }
    };

    source.onerror = () => {
      source.close();
      setStatus((prev) => (prev === 'running' ? 'error' : prev));
      setLines((prev) => (prev.length ? prev : ['Could not reach the agent service. Make sure agent-service is running.']));
    };
  };

  const isBusy = status === 'running';

  return (
    <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-5" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-primary animate-pulse' : status === 'error' ? 'bg-danger' : 'bg-success'}`} />
          <span className="text-[13px] font-semibold text-kameti-text">
            {isBusy ? 'Agent is reasoning…' : status === 'error' ? 'Agent unreachable' : 'Agent monitoring'}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRun} loading={isBusy}>
          Run agent check
        </Button>
      </div>

      {status === 'idle' && lines.length === 0 ? (
        <p className="text-[13px] text-kameti-text-secondary">
          Last checked {agentStatus.lastChecked}. Click "Run agent check" to watch it reason live, step by step.
        </p>
      ) : (
        <div ref={scrollRef} className="bg-kameti-bg border border-kameti-border rounded-lg px-3 py-2.5 max-h-[220px] overflow-y-auto space-y-1.5">
          {toolCalls.map((name, i) => (
            <p key={`tool-${i}`} className="text-[12px] text-primary font-mono">
              🔧 calling <span className="font-semibold">{name}</span>…
            </p>
          ))}
          {lines.map((line, i) => (
            <p key={`line-${i}`} className="text-[13px] text-kameti-text-secondary font-mono whitespace-pre-line">
              {line}
            </p>
          ))}
          {isBusy && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse align-middle" />}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { committees, agentActivity, decisions, payments } = useApp();

  const activeCommittees = committees.filter(c => c.status !== 'completed');
  const totalCollected = committees.reduce((sum, c) => sum + c.potCollected, 0);
  const pendingPayments = Object.values(payments).flat().filter(p => p.status === 'overdue' || p.status === 'pending').length;
  const pendingDecisions = decisions.filter(d => d.status === 'pending').length;
  const recentActivity = agentActivity.slice(0, 5);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1200px] mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold text-kameti-text">Good morning, Raza</h2>
        <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary mt-1">{"Here's what Kameti is handling for you."}</p>
      </div>

      {/* Action banner */}
      <ActionBanner />

      {/* Live agent panel — real, on-demand agent reasoning shown as it happens */}
      <LiveAgentPanel />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Committees"
          value={activeCommittees.length}
          sub="Active committees"
          icon={<UsersRound size={18} />}
        />
        <StatCard
          label="Contributions"
          value={formatCurrency(totalCollected)}
          sub="Across active cycles"
          icon={<CircleDollarSign size={18} />}
        />
        <StatCard
          label="Pending Payments"
          value={pendingPayments}
          sub="Across committees"
          icon={<Clock size={18} />}
          variant={pendingPayments > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Decisions"
          value={pendingDecisions}
          sub={pendingDecisions > 0 ? 'Needs attention' : 'All clear'}
          icon={<AlertCircle size={18} />}
          variant={pendingDecisions > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Committees + Activity — stacked on mobile, side-by-side on large */}
      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Committees */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-kameti-text">Your committees</h2>
            <Link href="/committees" className="flex items-center gap-1 text-[13px] text-primary font-medium hover:text-primary-dark transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {committees.map(c => <CommitteeCard key={c.id} committee={c} />)}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-kameti-text">Recent activity</h2>
            <Link href="/agent" className="flex items-center gap-1 text-[13px] text-primary font-medium hover:text-primary-dark transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-kameti-border p-4 sm:p-5" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-kameti-text-muted text-center py-4">No activity yet</p>
            ) : (
              recentActivity.map((action, i) => (
                <ActivityItem key={action.id} action={action} isLast={i === recentActivity.length - 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
