import { prisma } from '@/lib/db';

export interface RaiseDecisionInput {
  committeeId: string;
  committeeName: string;
  cycleNumber?: number;
  type: string;
  title: string;
  description: string;
  recommendation: string;
  evidence: Record<string, unknown>;
}

export async function raiseDecision(input: RaiseDecisionInput) {
  const decision = await prisma.decision.create({
    data: {
      committeeId: input.committeeId,
      committeeName: input.committeeName,
      cycleNumber: input.cycleNumber,
      type: input.type,
      title: input.title,
      description: input.description,
      recommendation: input.recommendation,
      evidence: input.evidence,
      status: 'pending',
    },
  });

  await prisma.agentAction.create({
    data: {
      committeeId: input.committeeId,
      type: 'DECISION_REQUIRED',
      title: input.title,
      description: input.description,
      why: input.recommendation,
      severity: 'warning',
      requiresHuman: true,
      decisionId: decision.id,
    },
  });

  await prisma.notification.create({
    data: {
      committeeId: input.committeeId,
      type: 'decision',
      title: 'Decision requires your attention',
      description: input.title,
      severity: 'warning',
      actionUrl: '/decisions',
    },
  });

  return decision;
}

export type ResolveDecisionStatus = 'approved' | 'resolved' | 'dismissed';

export interface ResolveDecisionInput {
  decisionId: string;
  status: ResolveDecisionStatus;
  resolution: string;
}

/** Called when the human organizer acts on a pending decision from the Decisions page. */
export async function resolveDecision(input: ResolveDecisionInput) {
  const decision = await prisma.decision.update({
    where: { id: input.decisionId },
    data: {
      status: input.status,
      resolution: input.resolution,
      resolvedAt: new Date(),
    },
  });

  const agentAction = await prisma.agentAction.create({
    data: {
      committeeId: decision.committeeId,
      type: 'DECISION_RESOLVED',
      title: 'Decision resolved',
      description: input.resolution,
      severity: 'success',
      requiresHuman: false,
      decisionId: decision.id,
    },
  });

  return { decision, agentAction };
}
