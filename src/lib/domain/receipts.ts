export interface VerifyReceiptInput {
  imageUrl: string;
  expectedAmount: number;
  /** Basic-auth credentials, needed to fetch protected media (e.g. Twilio's MediaUrl). */
  authUser?: string;
  authPass?: string;
}

export interface VerifyReceiptResult {
  matches: boolean;
  detectedAmount: number | null;
  detectedDate: string | null;
  detectedReference: string | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

/**
 * Asks the Python agent-service (Strands + Gemini) to read and validate a
 * payment receipt screenshot.
 *
 * This used to call Amazon Bedrock directly from this function (see
 * agent-service/README.md for why it moved). It's now a thin HTTP call so
 * the vision model, like the agent's reasoning, runs on Gemini via the
 * agent-service, avoiding a second paid provider. It's deliberately still a
 * plain function (not a Strands tool itself) so it can be called both from
 * the agent's verify_receipt tool (agent-service side) and directly from the
 * Twilio webhook handler here.
 */
export async function verifyReceiptImage(input: VerifyReceiptInput): Promise<VerifyReceiptResult> {
  const baseUrl = process.env.AGENT_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('AGENT_SERVICE_URL is not configured — cannot reach the agent-service for receipt verification.');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/verify-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_AGENT_SECRET ?? '',
    },
    body: JSON.stringify({
      imageUrl: input.imageUrl,
      expectedAmount: input.expectedAmount,
      authUser: input.authUser,
      authPass: input.authPass,
    }),
  });

  if (!response.ok) {
    throw new Error(`agent-service returned HTTP ${response.status} for receipt verification.`);
  }

  const parsed = (await response.json()) as Partial<VerifyReceiptResult>;

  return {
    matches: Boolean(parsed.matches),
    detectedAmount: parsed.detectedAmount ?? null,
    detectedDate: parsed.detectedDate ?? null,
    detectedReference: parsed.detectedReference ?? null,
    confidence: parsed.confidence ?? 'low',
    notes: parsed.notes ?? '',
  };
}
