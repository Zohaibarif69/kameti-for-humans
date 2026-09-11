import { NextRequest, NextResponse } from 'next/server';
import { advanceCycle } from '@/lib/domain/cycles';
import { checkInternalSecret } from '@/lib/internalAuth';

export const runtime = 'nodejs';

/**
 * POST /api/internal/advance-cycle
 * Body: { committeeId }
 *
 * Thin wrapper over the same advanceCycle domain function the old
 * advance_cycle Strands tool called directly.
 */
export async function POST(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const { committeeId } = await req.json();
  const result = await advanceCycle(committeeId);
  return NextResponse.json(result);
}
