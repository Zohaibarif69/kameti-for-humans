import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function relativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * GET /api/state
 *
 * One aggregate call that returns everything AppContext needs, shaped to
 * match src/types/index.ts exactly — so the frontend components need zero
 * changes, only their data source (AppContext) does.
 */
export async function GET() {
  const [committeesRaw, payments, agentActivity, decisions, notifications] = await Promise.all([
    prisma.committee.findMany({
      include: { members: { include: { paymentRecords: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany(),
    prisma.agentAction.findMany({ orderBy: { timestamp: 'desc' } }),
    prisma.decision.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const committees = committeesRaw.map((c: (typeof committeesRaw)[number]) => {
    const nextRecipient = c.members.find((m: (typeof c.members)[number]) => m.id === c.nextRecipientId);
    return {
      id: c.id,
      name: c.name,
      contributionAmount: c.contributionAmount,
      frequency: c.frequency,
      totalCycles: c.totalCycles,
      currentCycle: c.currentCycle,
      memberCount: c.members.length,
      status: c.status,
      nextRecipientName: nextRecipient?.name ?? '',
      nextRecipientId: c.nextRecipientId ?? '',
      deadline: c.deadline?.toISOString() ?? '',
      potCollected: c.potCollected,
      potExpected: c.potExpected,
      paymentsReceived: c.paymentsReceived,
      createdAt: c.createdAt.toISOString(),
    };
  });

  const members: Record<string, unknown[]> = {};
  const rotationByCommittee = await prisma.rotationEntry.findMany({ orderBy: { cycleNumber: 'asc' } });
  const rotation: Record<string, unknown[]> = {};

  for (const c of committeesRaw) {
    members[c.id] = c.members.map((m: (typeof c.members)[number]) => ({
      id: m.id,
      committeeId: m.committeeId,
      name: m.name,
      phone: m.phone ?? undefined,
      language: m.language,
      contribution: m.contribution,
      cyclesCompleted: m.cyclesCompleted,
      onTimeCount: m.onTimeCount,
      lateCount: m.lateCount,
      missedCount: m.missedCount,
      currentStatus: m.currentStatus,
      memberSince: m.memberSince.toISOString(),
      avatar: m.avatar ?? undefined,
      paymentHistory: m.paymentRecords.map((p: (typeof m.paymentRecords)[number]) => ({
        cycleNumber: p.cycleNumber,
        status: p.status,
        date: p.date?.toISOString(),
      })),
    }));
    rotation[c.id] = rotationByCommittee
      .filter((r: (typeof rotationByCommittee)[number]) => r.committeeId === c.id)
      .map((r: (typeof rotationByCommittee)[number]) => ({
        cycleNumber: r.cycleNumber,
        memberId: r.memberId,
        memberName: r.memberName,
        amount: r.amount,
        status: r.status,
        date: r.date?.toISOString(),
      }));
  }

  const paymentsByCommittee: Record<string, unknown[]> = {};
  for (const p of payments) {
    (paymentsByCommittee[p.committeeId] ??= []).push({
      id: p.id,
      committeeId: p.committeeId,
      cycleId: p.cycleId ?? '',
      memberId: p.memberId,
      memberName: p.memberName,
      expectedAmount: p.expectedAmount,
      receivedAmount: p.receivedAmount ?? undefined,
      status: p.status,
      submittedAt: p.submittedAt?.toISOString(),
      verifiedAt: p.verifiedAt?.toISOString(),
      reference: p.reference ?? undefined,
      receiptUrl: p.receiptUrl ?? undefined,
      method: p.method ?? undefined,
      verifiedBy: p.verifiedBy ?? undefined,
      notes: p.notes ?? undefined,
    });
  }

  const activeCommittee = committeesRaw.find((c: (typeof committeesRaw)[number]) => c.status === 'active' || c.status === 'needs_attention');
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const lastAction = agentActivity[0];
  const lastCheckedLabel = lastAction ? relativeTimeLabel(lastAction.timestamp) : 'Not yet run';

  const agentStatus = {
    status: (committeesRaw.some((c: (typeof committeesRaw)[number]) => c.status === 'needs_attention') ? 'needs_attention' : 'active') as
      | 'active'
      | 'needs_attention',
    lastChecked: lastCheckedLabel,
    monitoringCommittee: activeCommittee?.name ?? 'No active committees',
    nextCheck: 'On next scheduled run (every 6 hours)',
    actionsToday: agentActivity.filter((a: (typeof agentActivity)[number]) => a.timestamp >= startOfToday).length,
    humanDecisions: decisions.filter((d: (typeof decisions)[number]) => d.status === 'pending').length,
  };

  return NextResponse.json({
    committees,
    members,
    payments: paymentsByCommittee,
    rotation,
    agentActivity: agentActivity.map((a: (typeof agentActivity)[number]) => ({
      id: a.id,
      committeeId: a.committeeId,
      cycleId: a.cycleId ?? undefined,
      memberId: a.memberId ?? undefined,
      type: a.type,
      title: a.title,
      description: a.description,
      why: a.why ?? undefined,
      outcome: a.outcome ?? undefined,
      severity: a.severity,
      timestamp: a.timestamp.toISOString(),
      requiresHuman: a.requiresHuman,
      decisionId: a.decisionId ?? undefined,
    })),
    decisions: decisions.map((d: (typeof decisions)[number]) => ({
      id: d.id,
      committeeId: d.committeeId,
      committeeName: d.committeeName,
      cycleId: d.cycleId ?? '',
      cycleNumber: d.cycleNumber ?? undefined,
      type: d.type,
      title: d.title,
      description: d.description,
      recommendation: d.recommendation,
      evidence: d.evidence,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      resolvedAt: d.resolvedAt?.toISOString(),
      resolution: d.resolution ?? undefined,
    })),
    notifications: notifications.map((n: (typeof notifications)[number]) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      severity: n.severity,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      committeeId: n.committeeId ?? undefined,
      actionUrl: n.actionUrl ?? undefined,
    })),
    agentStatus,
  });
}
