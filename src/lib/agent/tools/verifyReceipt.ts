import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { verifyReceiptImage } from '@/lib/domain/receipts';

export const verifyReceipt = tool({
  name: 'verify_receipt',
  description:
    'Look at a payment receipt/screenshot image and check whether it shows a valid payment of at ' +
    'least the expected amount. Returns the detected amount, date, and reference, plus whether it ' +
    'matches. Use the result to decide your next step yourself: if it clearly matches, call ' +
    'record_payment; if it looks wrong, unclear, or suspicious, call raise_decision instead of ' +
    'guessing.',
  inputSchema: z.object({
    imageUrl: z.string().describe('A URL the receipt image can be fetched from.'),
    expectedAmount: z.number().describe('The amount this member is expected to have paid.'),
  }),
  callback: async ({ imageUrl, expectedAmount }) => {
    try {
      return await verifyReceiptImage({ imageUrl, expectedAmount });
    } catch (error) {
      return {
        matches: false as const,
        detectedAmount: null,
        detectedDate: null,
        detectedReference: null,
        confidence: 'low' as const,
        notes: `Could not verify the receipt: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});
