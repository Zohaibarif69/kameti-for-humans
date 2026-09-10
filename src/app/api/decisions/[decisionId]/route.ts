import { NextRequest, NextResponse } from 'next/server';
import { resolveDecision, type ResolveDecisionStatus } from '@/lib/domain/decisions';

export const runtime = 'nodejs';

/**
 * PATCH /api/decisions/[decisionId]
 * Body: { "status": "approved" | "resolved" | "dismissed", "resolution": "..." }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ decisionId: string }> }) {
  const { decisionId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, resolution } = body as { status?: ResolveDecisionStatus; resolution?: string };

  if (!status || !resolution) {
    return NextResponse.json({ error: 'status and resolution are required.' }, { status: 400 });
  }

  const result = await resolveDecision({ decisionId, status, resolution });
  return NextResponse.json(result);
}
