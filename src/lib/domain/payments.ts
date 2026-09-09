import { prisma } from '@/lib/db';

export interface RecordPaymentInput {
  committeeId: string;
  memberId: string;
  amount: number;
  method?: string;
  reference?: string;
  wasLate?: boolean;
  verifiedBy?: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  const { committeeId, memberId, amount, wasLate = false, verifiedBy = 'Kameti Agent' } = input;
  const method = input.method ?? 'Bank transfer';

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return { recorded: false as const, reason: 'Member not found.' };
  }

  const [payment, , committee] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        committeeId,
        memberId,
        memberName: member.name,
        expectedAmount: member.contribution,
        receivedAmount: amount,
        status: 'paid',
        submittedAt: new Date(),
        verifiedAt: new Date(),
        reference: input.reference ?? `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
        method,
        verifiedBy,
      },
    }),
    prisma.member.update({
      where: { id: memberId },
      data: {
        currentStatus: 'paid',
        cyclesCompleted: { increment: 1 },
        onTimeCount: wasLate ? undefined : { increment: 1 },
        lateCount: wasLate ? { increment: 1 } : undefined,
      },
    }),
    prisma.committee.update({
      where: { id: committeeId },
      data: {
        potCollected: { increment: amount },
        paymentsReceived: { increment: 1 },
      },
    }),
  ]);

  await prisma.agentAction.create({
    data: {
      committeeId,
      memberId,
      type: 'PAYMENT_RECEIVED',
      title: `Payment received from ${member.name}`,
      description: `Confirmed ${method} payment of ${amount}.`,
      severity: 'success',
      requiresHuman: false,
    },
  });

  return {
    recorded: true as const,
    payment,
    potCollected: committee.potCollected,
    paymentsReceived: committee.paymentsReceived,
  };
}
