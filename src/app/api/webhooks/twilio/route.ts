import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyReceiptImage } from '@/lib/domain/receipts';
import { recordPayment } from '@/lib/domain/payments';
import { raiseDecision } from '@/lib/domain/decisions';

export const runtime = 'nodejs';
export const maxDuration = 60;

function normalizePhone(value: string) {
  return value.replace('whatsapp:', '').replace(/[\s()-]/g, '');
}

const emptyTwiml = () =>
  new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });

/**
 * POST /api/webhooks/twilio
 *
 * Configure this as your Twilio Sandbox's "WHEN A MESSAGE COMES IN" webhook.
 * Handles two cases:
 *  - A photo (a receipt): runs it through verify_receipt's logic directly,
 *    then records the payment or raises a decision depending on the result.
 *  - Plain text: hands it to the full Kameti agent, so free-form replies
 *    (disputes, "I want to leave", questions) get the same escalation policy
 *    applied to them as everything else the agent does.
 *
 * NOTE: for a hackathon demo this does not validate Twilio's request
 * signature (X-Twilio-Signature) — add that before using this with real
 * user data in production.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = String(form.get('From') ?? '');
  const body = String(form.get('Body') ?? '').trim();
  const numMedia = Number(form.get('NumMedia') ?? '0');
  const mediaUrl = numMedia > 0 ? String(form.get('MediaUrl0') ?? '') : null;

  const phone = normalizePhone(from);
  const members = await prisma.member.findMany();
  const member = members.find(
    (m: (typeof members)[number]) => m.phone && normalizePhone(m.phone) === phone,
  );

  if (!member) {
    console.warn(`[twilio-webhook] message from unrecognized number: ${from}`);
    return emptyTwiml();
  }

  const committee = await prisma.committee.findUnique({ where: { id: member.committeeId } });
  if (!committee) return emptyTwiml();

  if (mediaUrl) {
    let result;
    try {
      result = await verifyReceiptImage({
        imageUrl: mediaUrl,
        expectedAmount: member.contribution,
        authUser: process.env.TWILIO_ACCOUNT_SID,
        authPass: process.env.TWILIO_AUTH_TOKEN,
      });
    } catch (error) {
      await raiseDecision({
        committeeId: committee.id,
        committeeName: committee.name,
        type: 'suspicious_receipt',
        title: `Could not read ${member.name}'s receipt`,
        description: error instanceof Error ? error.message : 'The receipt image could not be processed.',
        recommendation: 'Ask the member to resend a clearer photo, or verify the payment manually.',
        evidence: { memberName: member.name, currentContribution: member.contribution },
      });
      return emptyTwiml();
    }

    await prisma.agentAction.create({
      data: {
        committeeId: committee.id,
        memberId: member.id,
        type: 'RECEIPT_VERIFIED',
        title: `Receipt received from ${member.name}`,
        description: result.notes || `Detected amount: ${result.detectedAmount ?? 'unknown'} (confidence: ${result.confidence})`,
        severity: result.matches ? 'success' : 'warning',
        requiresHuman: !result.matches,
      },
    });

    if (result.matches && result.confidence !== 'low') {
      await recordPayment({
        committeeId: committee.id,
        memberId: member.id,
        amount: result.detectedAmount ?? member.contribution,
        method: 'WhatsApp receipt',
        reference: result.detectedReference ?? undefined,
      });
    } else {
      await raiseDecision({
        committeeId: committee.id,
        committeeName: committee.name,
        type: 'suspicious_receipt',
        title: `${member.name}'s receipt needs review`,
        description: result.notes || 'The submitted receipt could not be automatically verified.',
        recommendation: 'Review the receipt manually and confirm the payment, or ask the member to resend it.',
        evidence: {
          memberName: member.name,
          currentContribution: member.contribution,
          notes: `Detected amount: ${result.detectedAmount ?? 'unknown'}, confidence: ${result.confidence}`,
        },
      });
    }

    return emptyTwiml();
  }

  if (body) {
    // Hands free-text replies to the Python agent-service (Strands + Gemini)
    // instead of the in-process TS/Bedrock agent, so text and receipt-photo
    // replies both go through the same Gemini-backed reasoning. See
    // agent-service/api/index.py's /api/message handler.
    try {
      const baseUrl = process.env.AGENT_SERVICE_URL;
      if (!baseUrl) throw new Error('AGENT_SERVICE_URL is not configured.');

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_AGENT_SECRET ?? '',
        },
        body: JSON.stringify({
          memberId: member.id,
          memberName: member.name,
          committeeId: committee.id,
          committeeName: committee.name,
          message: body,
        }),
      });

      if (!response.ok) {
        console.error(`[twilio-webhook] agent-service returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[twilio-webhook] agent-service call failed:', error);
    }
  }

  return emptyTwiml();
}
