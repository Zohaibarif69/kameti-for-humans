import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/committees/[committeeId]/members
 * Body: { name, phone?, language?, contribution }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ committeeId: string }> }) {
  const { committeeId } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, phone, language, contribution } = body as {
    name?: string;
    phone?: string;
    language?: string;
    contribution?: number;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  }

  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) {
    return NextResponse.json({ error: 'Committee not found.' }, { status: 404 });
  }

  const member = await prisma.member.create({
    data: {
      committeeId,
      name,
      phone: phone || undefined,
      language: (language as 'english' | 'urdu' | 'hindi') || 'english',
      contribution: contribution ?? committee.contributionAmount,
      currentStatus: 'pending',
    },
  });

  await prisma.agentAction.create({
    data: {
      committeeId,
      memberId: member.id,
      type: 'MEMBER_ADDED',
      title: `${name} added to ${committee.name}`,
      description: 'New member added by the organizer.',
      severity: 'info',
      requiresHuman: false,
    },
  });

  return NextResponse.json({ created: true, member }, { status: 201 });
}
