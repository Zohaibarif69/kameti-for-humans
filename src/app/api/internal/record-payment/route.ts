import { NextRequest, NextResponse } from 'next/server';
import { recordPayment } from '@/lib/domain/payments';
import { checkInternalSecret } from '@/lib/internalAuth';

export const runtime = 'nodejs';

/**
 * POST /api/internal/record-payment
 * Body: { committeeId, memberId, amount, method?, reference?, wasLate? }
 *
 * Thin wrapper over the same recordPayment domain function the old
 * record_payment Strands tool called directly.
 */
export async function POST(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const body = await req.json();
  const result = await recordPayment({
    committeeId: body.committeeId,
    memberId: body.memberId,
    amount: body.amount,
    method: body.method,
    reference: body.reference,
    wasLate: body.wasLate,
    verifiedBy: 'Kameti Agent (Gemini)',
  });

  if (!result.recorded) return NextResponse.json(result);

  return NextResponse.json({
    recorded: true,
    potCollected: result.potCollected,
    paymentsReceived: result.paymentsReceived,
  });
}
