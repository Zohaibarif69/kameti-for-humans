import { prisma } from '@/lib/db';

export interface AdvanceCycleResult {
  advanced: boolean;
  reason?: string;
  committeeId: string;
  newCycle?: number;
  completed?: boolean;
  nextRecipientName?: string;
}

/**
 * Moves a committee's rotation forward by one cycle: marks the current
 * rotation entry completed, activates the next one, resets member payment
 * status for the new cycle, and resets the pot counters.
 *
 * Refuses to advance if not everyone has paid yet — callers (the agent tool,
 * or a future "force advance" admin action) should check `reason` when
 * `advanced` is false.
 */
export async function advanceCycle(committeeId: string, opts: { force?: boolean } = {}): Promise<AdvanceCycleResult> {
  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    include: { members: true, rotation: { orderBy: { cycleNumber: 'asc' } } },
  });

  if (!committee) {
    return { advanced: false, reason: 'Committee not found.', committeeId };
  }

  const allPaid = committee.members.every((m: (typeof committee.members)[number]) => m.currentStatus === 'paid');
  if (!allPaid && !opts.force) {
    return { advanced: false, reason: 'Not everyone has paid for this cycle yet.', committeeId };
  }

  const isFinalCycle = committee.currentCycle >= committee.totalCycles;
  const nextEntry = committee.rotation.find(
    (r: (typeof committee.rotation)[number]) => r.cycleNumber === committee.currentCycle + 1,
  );

  await prisma.$transaction([
    // Close out the current cycle's rotation entry.
    prisma.rotationEntry.updateMany({
      where: { committeeId, cycleNumber: committee.currentCycle },
      data: { status: 'completed' },
    }),
    // Activate the next one, if there is one.
    ...(nextEntry
      ? [
          prisma.rotationEntry.update({
            where: { id: nextEntry.id },
            data: { status: 'current' },
          }),
        ]
      : []),
    // Reset every member's status for the new cycle.
    prisma.member.updateMany({
      where: { committeeId },
      data: { currentStatus: 'pending' },
    }),
    // Advance the committee itself.
    prisma.committee.update({
      where: { id: committeeId },
      data: {
        currentCycle: isFinalCycle ? committee.currentCycle : committee.currentCycle + 1,
        status: isFinalCycle ? 'completed' : 'active',
        potCollected: 0,
        paymentsReceived: 0,
        nextRecipientId: nextEntry?.memberId ?? committee.nextRecipientId,
      },
    }),
    prisma.agentAction.create({
      data: {
        committeeId,
        type: 'CYCLE_COMPLETED',
        title: isFinalCycle ? `${committee.name} completed its final cycle` : `${committee.name} moved to cycle ${committee.currentCycle + 1}`,
        description: nextEntry
          ? `${nextEntry.memberName} is now the recipient for this cycle.`
          : 'All cycles have been completed.',
        severity: 'success',
        requiresHuman: false,
      },
    }),
  ]);

  return {
    advanced: true,
    committeeId,
    newCycle: isFinalCycle ? committee.currentCycle : committee.currentCycle + 1,
    completed: isFinalCycle,
    nextRecipientName: nextEntry?.memberName,
  };
}
