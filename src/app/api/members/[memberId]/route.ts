import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * PATCH /api/members/[memberId]
 * Body: any subset of { name, phone, language, contribution }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, phone, language, contribution } = body as {
    name?: string;
    phone?: string;
    language?: string;
    contribution?: number;
  };

  const member = await prisma.member.update({
    where: { id: memberId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(language !== undefined ? { language: language as 'english' | 'urdu' | 'hindi' } : {}),
      ...(contribution !== undefined ? { contribution } : {}),
    },
  });

  return NextResponse.json({ updated: true, member });
}

/**
 * DELETE /api/members/[memberId]
 *
 * Removes a member from their committee (e.g. they left, or were added by
 * mistake) along with their payment history — cascade deletes in the schema
 * handle the cleanup. There is no undo.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  await prisma.member.delete({ where: { id: memberId } });
  return NextResponse.json({ deleted: true });
}
