import { NextRequest, NextResponse } from 'next/server';
import { recordPayment } from '@/lib/domain/payments';

export const runtime = 'nodejs';

/**
 * POST /api/payments
 * Body: { committeeId, memberId, amount, method? }
 *
 * For manually recording a payment from the UI (as opposed to the agent's
 * record_payment tool, which shares the same underlying domain function).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { committeeId, memberId, amount, method } = body as {
    committeeId?: string;
    memberId?: string;
    amount?: number;
    method?: string;
  };

  if (!committeeId || !memberId || typeof amount !== 'number') {
    return NextResponse.json({ error: 'committeeId, memberId, and amount are required.' }, { status: 400 });
  }

  const result = await recordPayment({ committeeId, memberId, amount, method, verifiedBy: 'Organizer' });
  return NextResponse.json(result);
}
