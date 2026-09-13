import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/twilio';

export const sendReminder = tool({
  name: 'send_reminder',
  description:
    'Send a polite WhatsApp payment reminder to a specific committee member. Use this for ' +
    'members who have not yet paid this cycle, before escalating to the human organizer.',
  inputSchema: z.object({
    committeeId: z.string(),
    memberId: z.string().describe('The member to remind.'),
    message: z
      .string()
      .describe(
        'The reminder text to send. Keep it short, friendly, and specific (mention the committee name and amount due).',
      ),
  }),
  callback: async ({ committeeId, memberId, message }) => {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || !member.phone) {
      return { sent: false as const, reason: 'Member not found or has no phone number on file.' };
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

    return { sent: true as const, mocked: result.mocked, memberName: member.name };
  },
});
