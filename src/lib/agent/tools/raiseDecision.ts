import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { raiseDecision as raiseDecisionDomain } from '@/lib/domain/decisions';

export const raiseDecision = tool({
  name: 'raise_decision',
  description:
    'Escalate to the human organizer. Use this ONLY for the cases described in your system ' +
    'prompt (e.g. a payment more than 3 days overdue after two reminders, a receipt that looks ' +
    'wrong, or a member requesting to leave). Never use this for routine, in-policy actions — ' +
    'handle those yourself with the other tools. Always include your reasoning as evidence and a ' +
    'clear, specific recommendation.',
  inputSchema: z.object({
    committeeId: z.string(),
    committeeName: z.string(),
    cycleNumber: z.number().optional(),
    type: z
      .string()
      .describe('Short machine-readable category, e.g. "overdue_payment", "suspicious_receipt", "member_leaving".'),
    title: z.string().describe('Short human-readable title, e.g. "Zainab\'s payment is overdue".'),
    description: z.string().describe('1-2 sentence plain-language explanation of the situation.'),
    recommendation: z.string().describe('What you, the agent, recommend the organizer do, and why.'),
    evidence: z
      .object({
        latePayments: z.number().optional(),
        missedPayments: z.number().optional(),
        currentContribution: z.number().optional(),
        currentPot: z.number().optional(),
        expectedPot: z.number().optional(),
        memberName: z.string().optional(),
        notes: z.string().optional(),
      })
      .describe('The concrete data that led to this recommendation, shown to the organizer for context.'),
  }),
  callback: async ({ committeeId, committeeName, cycleNumber, type, title, description, recommendation, evidence }) => {
    const decision = await raiseDecisionDomain({
      committeeId,
      committeeName,
      cycleNumber,
      type,
      title,
      description,
      recommendation,
      evidence,
    });
    return { raised: true as const, decisionId: decision.id };
  },
});
