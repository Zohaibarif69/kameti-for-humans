import { NextRequest, NextResponse } from 'next/server';
import { raiseDecision } from '@/lib/domain/decisions';
import { checkInternalSecret } from '@/lib/internalAuth';

export const runtime = 'nodejs';

/**
 * POST /api/internal/raise-decision
 * Body: { committeeId, committeeName, cycleNumber?, type, title, description, recommendation, evidence }
 *
 * Thin wrapper over the same raiseDecision domain function the old
 * raise_decision Strands tool called directly.
 */
export async function POST(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const body = await req.json();
  const decision = await raiseDecision({
    committeeId: body.committeeId,
    committeeName: body.committeeName,
    cycleNumber: body.cycleNumber,
    type: body.type,
    title: body.title,
    description: body.description,
    recommendation: body.recommendation,
    evidence: body.evidence ?? {},
  });

  return NextResponse.json({ raised: true, decisionId: decision.id });
}
