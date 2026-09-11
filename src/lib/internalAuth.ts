import { NextRequest, NextResponse } from 'next/server';

/**
 * Guards the /api/internal/* routes, which perform privileged mutations
 * (sending WhatsApp messages, recording payments, raising decisions) on
 * behalf of the Python agent service. These routes have no other auth in
 * front of them, so every call must carry a shared secret.
 *
 * Set INTERNAL_AGENT_SECRET to the same value in both this app's env and the
 * agent-service's env. Returns a 401 NextResponse if the check fails, or
 * null if the request is authorized.
 */
export function checkInternalSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.INTERNAL_AGENT_SECRET;

  if (!expected) {
    // Fail closed: an unset secret should block these routes, not open them.
    return NextResponse.json(
      { error: 'INTERNAL_AGENT_SECRET is not configured on the server.' },
      { status: 500 },
    );
  }

  const provided = req.headers.get('x-internal-secret');
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
