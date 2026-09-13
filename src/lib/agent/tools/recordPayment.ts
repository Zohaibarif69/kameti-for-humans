import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { recordPayment as recordPaymentDomain } from '@/lib/domain/payments';

export const recordPayment = tool({
  name: 'record_payment',
  description:
    'Record a confirmed, verified payment from a member for the current cycle. Only call this ' +
    'after the amount has been confirmed (e.g. via verify_receipt) — this updates the committee pot ' +
    "and the member's on-time/late counters.",
  inputSchema: z.object({
    committeeId: z.string(),
    memberId: z.string(),
    amount: z.number().describe('The amount received, in the committee currency (e.g. PKR).'),
    method: z.string().default('Bank transfer').describe('Payment method, e.g. "Bank transfer".'),
    reference: z.string().optional().describe('Transaction reference or receipt ID, if available.'),
    wasLate: z.boolean().default(false).describe('Whether this payment came in after the deadline.'),
  }),
  callback: async ({ committeeId, memberId, amount, method, reference, wasLate }) => {
    const result = await recordPaymentDomain({ committeeId, memberId, amount, method, reference, wasLate });
    if (!result.recorded) return result;
    return {
      recorded: true as const,
      potCollected: result.potCollected,
      paymentsReceived: result.paymentsReceived,
    };
  },
});
