import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// The agent-service round-trip (Gemini reasoning + tool calls back into this
// app) can take longer than a typical API response — this needs the Node
// runtime (not Edge) and a generous timeout.
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Calls the Python agent-service (Strands + Gemini) for a single committee.
 * See agent-service/api/index.py's /api/run handler for the agent side of
 * this. This replaced an in-process call to the TS Strands/Bedrock agent
 * (src/lib/agent/kametiAgent.ts) — that code is still in the repo as a
 * reference/fallback, but is no longer called by this route.
 */
async function callAgentService(committee: {
  id: string;
  name: string;
  currentCycle: number;
  totalCycles: number;
}) {
  const baseUrl = process.env.AGENT_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('AGENT_SERVICE_URL is not configured.');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_AGENT_SECRET ?? '',
    },
    body: JSON.stringify({
      committeeId: committee.id,
      committeeName: committee.name,
      currentCycle: committee.currentCycle,
      totalCycles: committee.totalCycles,
    }),
  });

  if (!response.ok) {
    throw new Error(`agent-service returned HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Runs the agent's monitoring pass over every committee that isn't finished
 * yet (or a single one, if committeeId is given). Shared by both handlers
 * below so the same logic works whether it's triggered manually or on a
 * schedule.
 */
async function runAgentPass(committeeId?: string) {
  const committees = await prisma.committee.findMany({
    where: {
      status: { in: ['active', 'needs_attention'] },
      ...(committeeId ? { id: committeeId } : {}),
    },
  });

  if (committees.length === 0) {
    return { ran: 0, results: [] };
  }

  const results = [];
  for (const committee of committees) {
    try {
      const result = await callAgentService(committee);
      results.push({ committeeId: committee.id, name: committee.name, ok: true, summary: result.summary });
    } catch (error) {
      results.push({
        committeeId: committee.id,
        name: committee.name,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { ran: results.length, results };
}

/**
 * POST /api/agent/run
 * Body (optional): { "committeeId": "..." }
 *
 * Manual trigger — e.g. a "Run agent check" button in the Agent page. Great
 * for demos, since you can show the agent acting on command.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { committeeId } = body as { committeeId?: string };
  return NextResponse.json(await runAgentPass(committeeId));
}

/**
 * GET /api/agent/run
 *
 * Scheduled trigger — Vercel Cron Jobs call scheduled routes with GET (see
 * vercel.json). If you deploy on AWS instead, point an EventBridge
 * Scheduler rule at this same URL with an HTTP GET target.
 */
export async function GET() {
  return NextResponse.json(await runAgentPass());
}
