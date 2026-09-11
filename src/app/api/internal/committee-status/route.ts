import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkInternalSecret } from '@/lib/internalAuth';

export const runtime = 'nodejs';

/**
 * GET /api/internal/committee-status?committeeId=...
 *
 * Same shape as the old get_committee_status Strands tool (see
 * src/lib/agent/tools/getCommitteeStatus.ts) — called over HTTP now by the
 * Python agent-service instead of running in-process.
 */
export async function GET(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const committeeId = req.nextUrl.searchParams.get('committeeId');
  if (!committeeId) {
    return NextResponse.json({ error: 'committeeId is required' }, { status: 400 });
  }

  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    include: { members: true },
  });

  if (!committee) {
    return NextResponse.json({ found: false, committeeId });
  }

  return NextResponse.json({
    found: true,
    id: committee.id,
    name: committee.name,
    status: committee.status,
    currentCycle: committee.currentCycle,
    totalCycles: committee.totalCycles,
    contributionAmount: committee.contributionAmount,
    potCollected: committee.potCollected,
    potExpected: committee.potExpected,
    paymentsReceived: committee.paymentsReceived,
    members: committee.members.map((m: (typeof committee.members)[number]) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      language: m.language,
      currentStatus: m.currentStatus,
      lateCount: m.lateCount,
      missedCount: m.missedCount,
    })),
  });
}
