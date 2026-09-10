import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * PATCH /api/committees/[committeeId]
 * Body: any subset of { name, contributionAmount, frequency, totalCycles, deadline, status }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ committeeId: string }> }) {
  const { committeeId } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, contributionAmount, frequency, totalCycles, deadline, status } = body as {
    name?: string;
    contributionAmount?: number;
    frequency?: string;
    totalCycles?: number;
    deadline?: string;
    status?: string;
  };

  const committee = await prisma.committee.update({
    where: { id: committeeId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(contributionAmount !== undefined ? { contributionAmount } : {}),
      ...(frequency !== undefined ? { frequency: frequency as 'monthly' | 'weekly' | 'biweekly' } : {}),
      ...(totalCycles !== undefined ? { totalCycles } : {}),
      ...(deadline !== undefined ? { deadline: new Date(deadline) } : {}),
      ...(status !== undefined ? { status: status as 'active' | 'needs_attention' | 'completed' | 'paused' } : {}),
    },
  });

  return NextResponse.json({ updated: true, committee });
}

/**
 * DELETE /api/committees/[committeeId]
 *
 * Permanently removes a committee and everything tied to it (members,
 * payments, rotation entries, agent activity, decisions) — the schema's
 * cascade deletes handle the cleanup. There is no undo; the confirmation
 * step lives in the "Manage committee" modal on the frontend.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ committeeId: string }> }) {
  const { committeeId } = await params;
  await prisma.committee.delete({ where: { id: committeeId } });
  return NextResponse.json({ deleted: true });
}
