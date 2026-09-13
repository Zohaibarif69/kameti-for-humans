import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const getCommitteeStatus = tool({
  name: 'get_committee_status',
  description:
    'Fetch the current status of a committee: its cycle progress, pot totals, and every ' +
    'member with their current payment status for this cycle. Use this first, before deciding ' +
    'whether reminders or escalation are needed.',
  inputSchema: z.object({
    committeeId: z.string().describe('The ID of the committee to check.'),
  }),
  callback: async ({ committeeId }) => {
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
      include: { members: true },
    });

    if (!committee) {
      return { found: false as const, committeeId };
    }

    return {
      found: true as const,
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
    };
  },
});
