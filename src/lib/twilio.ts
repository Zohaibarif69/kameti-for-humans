import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

const isConfigured = Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM);

const client = isConfigured ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

/**
 * Sends a WhatsApp message via the Twilio Sandbox.
 *
 * Until TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM are set
 * in .env, this logs to the console instead of throwing — so the agent loop
 * can be built and demoed before a real Twilio sandbox is wired up.
 */
export async function sendWhatsAppMessage(toPhone: string, body: string) {
  if (!client) {
    console.log(`[twilio:mock] to=${toPhone}\n${body}`);
    return { sid: 'mock', mocked: true as const };
  }

  const message = await client.messages.create({
    from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${toPhone}`,
    body,
  });

  return { sid: message.sid, mocked: false as const };
}
