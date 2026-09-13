import { tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { advanceCycle as advanceCycleDomain } from '@/lib/domain/cycles';

export const advanceCycle = tool({
  name: 'advance_cycle',
  description:
    'Move a committee to its next cycle once every member has paid for the current one: closes ' +
    'out the current rotation entry, activates the next recipient, and resets payment status for ' +
    'the new cycle. This will refuse and explain why if anyone still owes money — check ' +
    'get_committee_status first.',
  inputSchema: z.object({
    committeeId: z.string(),
  }),
  callback: async ({ committeeId }) => advanceCycleDomain(committeeId),
});
