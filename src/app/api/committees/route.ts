import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const committees = await prisma.committee.findMany({
    include: { members: true },
    orderBy: { createdAt: 'desc' },
  });

  const shaped = committees.map((c: (typeof committees)[number]) => {
    const nextRecipient = c.members.find((m: (typeof c.members)[number]) => m.id === c.nextRecipientId);
    return {
      id: c.id,
      name: c.name,
      contributionAmount: c.contributionAmount,
      frequency: c.frequency,
      totalCycles: c.totalCycles,
      currentCycle: c.currentCycle,
      memberCount: c.members.length,
      status: c.status,
      nextRecipientName: nextRecipient?.name ?? '',
      nextRecipientId: c.nextRecipientId ?? '',
      deadline: c.deadline?.toISOString() ?? '',
      potCollected: c.potCollected,
      potExpected: c.potExpected,
      paymentsReceived: c.paymentsReceived,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return NextResponse.json(shaped);
}

/**
 * POST /api/committees
 * Body: { name, contributionAmount, frequency, totalCycles, deadline? }
 *
 * Creates a new committee with no members yet — add members afterwards via
 * POST /api/committees/[committeeId]/members.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, contributionAmount, frequency, totalCycles, deadline } = body as {
    name?: string;
    contributionAmount?: number;
    frequency?: string;
    totalCycles?: number;
    deadline?: string;
  };

  if (!name || !contributionAmount || !frequency || !totalCycles) {
    return NextResponse.json(
      { error: 'name, contributionAmount, frequency, and totalCycles are required.' },
      { status: 400 },
    );
  }

  const committee = await prisma.committee.create({
    data: {
      name,
      contributionAmount,
      frequency: frequency as 'monthly' | 'weekly' | 'biweekly',
      totalCycles,
      currentCycle: 1,
      status: 'active',
      deadline: deadline ? new Date(deadline) : undefined,
      potCollected: 0,
      potExpected: 0,
      paymentsReceived: 0,
    },
  });

  return NextResponse.json({ created: true, committee }, { status: 201 });
}
