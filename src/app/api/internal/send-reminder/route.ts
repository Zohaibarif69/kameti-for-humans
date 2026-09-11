import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { checkInternalSecret } from '@/lib/internalAuth';

export const runtime = 'nodejs';

/**
 * POST /api/internal/send-reminder
 * Body: { committeeId, memberId, message }
 *
 * Same behavior as the old send_reminder Strands tool.
 */
export async function POST(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const { committeeId, memberId, message } = await req.json();

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || !member.phone) {
    return NextResponse.json({ sent: false, reason: 'Member not found or has no phone number on file.' });
  }

  const result = await sendWhatsAppMessage(member.phone, message);

  await prisma.agentAction.create({
    data: {
      committeeId,
      memberId,
      type: 'REMINDER_SENT',
      title: `Reminder sent to ${member.name}`,
      description: message,
      severity: 'info',
      requiresHuman: false,
    },
  });

  return NextResponse.json({ sent: true, mocked: result.mocked, memberName: member.name });
}
