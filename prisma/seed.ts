/**
 * Seeds the database from the app's existing mock data (src/mocks/data.ts),
 * so you get real committees/members/payments to develop and demo against
 * without hand-writing fixtures twice.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import {
  mockCommittees,
  mockMembers,
  mockPayments,
  mockRotation,
  mockAgentActivity,
  mockDecisions,
  mockNotifications,
} from '../src/mocks/data';

const prisma = new PrismaClient();

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(' at ', ' ');
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.agentAction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rotationEntry.deleteMany();
  await prisma.cyclePaymentRecord.deleteMany();
  await prisma.member.deleteMany();
  await prisma.committee.deleteMany();

  console.log('Seeding committees + members...');
  for (const committee of mockCommittees) {
    await prisma.committee.create({
      data: {
        id: committee.id,
        name: committee.name,
        contributionAmount: committee.contributionAmount,
        frequency: committee.frequency,
        totalCycles: committee.totalCycles,
        currentCycle: committee.currentCycle,
        status: committee.status,
        nextRecipientId: committee.nextRecipientId,
        deadline: toDate(committee.deadline),
        potCollected: committee.potCollected,
        potExpected: committee.potExpected,
        paymentsReceived: committee.paymentsReceived,
        createdAt: toDate(committee.createdAt) ?? new Date(),
      },
    });

    for (const member of mockMembers[committee.id] ?? []) {
      await prisma.member.create({
        data: {
          id: member.id,
          committeeId: committee.id,
          name: member.name,
          phone: member.phone,
          language: member.language,
          contribution: member.contribution,
          cyclesCompleted: member.cyclesCompleted,
          onTimeCount: member.onTimeCount,
          lateCount: member.lateCount,
          missedCount: member.missedCount,
          currentStatus: member.currentStatus,
          memberSince: toDate(member.memberSince) ?? new Date(),
          avatar: member.avatar,
          paymentRecords: {
            create: member.paymentHistory.map((p) => ({
              cycleNumber: p.cycleNumber,
              status: p.status,
              date: toDate(p.date),
            })),
          },
        },
      });
    }
  }

  console.log('Seeding payments...');
  for (const [committeeId, payments] of Object.entries(mockPayments)) {
    for (const payment of payments) {
      await prisma.payment.create({
        data: {
          id: payment.id,
          committeeId,
          cycleId: payment.cycleId,
          memberId: payment.memberId,
          memberName: payment.memberName,
          expectedAmount: payment.expectedAmount,
          receivedAmount: payment.receivedAmount,
          status: payment.status,
          submittedAt: toDate(payment.submittedAt),
          verifiedAt: toDate(payment.verifiedAt),
          reference: payment.reference,
          receiptUrl: payment.receiptUrl,
          method: payment.method,
          verifiedBy: payment.verifiedBy,
          notes: payment.notes,
        },
      });
    }
  }

  console.log('Seeding rotation schedules...');
  for (const [committeeId, entries] of Object.entries(mockRotation)) {
    for (const entry of entries) {
      await prisma.rotationEntry.create({
        data: {
          committeeId,
          cycleNumber: entry.cycleNumber,
          memberId: entry.memberId,
          memberName: entry.memberName,
          amount: entry.amount,
          status: entry.status,
          date: toDate(entry.date),
        },
      });
    }
  }

  console.log('Seeding agent activity...');
  for (const action of mockAgentActivity) {
    await prisma.agentAction.create({
      data: {
        id: action.id,
        committeeId: action.committeeId,
        cycleId: action.cycleId,
        memberId: action.memberId,
        type: action.type,
        title: action.title,
        description: action.description,
        why: action.why,
        outcome: action.outcome,
        severity: action.severity,
        timestamp: toDate(action.timestamp) ?? new Date(),
        requiresHuman: action.requiresHuman,
        decisionId: action.decisionId,
      },
    });
  }

  console.log('Seeding decisions...');
  for (const decision of mockDecisions) {
    await prisma.decision.create({
      data: {
        id: decision.id,
        committeeId: decision.committeeId,
        committeeName: decision.committeeName,
        cycleId: decision.cycleId,
        cycleNumber: decision.cycleNumber,
        type: decision.type,
        title: decision.title,
        description: decision.description,
        recommendation: decision.recommendation,
        evidence: decision.evidence,
        status: decision.status,
        createdAt: toDate(decision.createdAt) ?? new Date(),
        resolvedAt: toDate(decision.resolvedAt),
        resolution: decision.resolution,
      },
    });
  }

  console.log('Seeding notifications...');
  for (const notification of mockNotifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        committeeId: notification.committeeId,
        type: notification.type,
        title: notification.title,
        description: notification.description,
        severity: notification.severity,
        read: notification.read,
        createdAt: toDate(notification.createdAt) ?? new Date(),
        actionUrl: notification.actionUrl,
      },
    });
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
