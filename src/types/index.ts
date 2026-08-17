export type CommitteeStatus = 'active' | 'needs_attention' | 'completed' | 'paused';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'under_review' | 'disputed';
export type DecisionStatus = 'pending' | 'approved' | 'resolved' | 'dismissed';
export type AgentStatus = 'active' | 'monitoring' | 'needs_attention' | 'offline';
export type EventSeverity = 'info' | 'warning' | 'error' | 'success';
export type Frequency = 'monthly' | 'weekly' | 'biweekly';

export type AgentEventType =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'REMINDER_SENT'
  | 'DECISION_REQUIRED'
  | 'DECISION_RESOLVED'
  | 'CYCLE_COMPLETED'
  | 'RECEIPT_VERIFIED'
  | 'CYCLE_MONITORED'
  | 'MEMBER_ADDED';

export interface Committee {
  id: string;
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  totalCycles: number;
  currentCycle: number;
  memberCount: number;
  status: CommitteeStatus;
  nextRecipientName: string;
  nextRecipientId: string;
  deadline: string;
  potCollected: number;
  potExpected: number;
  paymentsReceived: number;
  createdAt: string;
}

export interface Member {
  id: string;
  committeeId: string;
  name: string;
  phone?: string;
  language: 'english' | 'urdu' | 'hindi';
  contribution: number;
  cyclesCompleted: number;
  onTimeCount: number;
  lateCount: number;
  missedCount: number;
  currentStatus: PaymentStatus;
  memberSince: string;
  avatar?: string;
  paymentHistory: CyclePaymentRecord[];
}

export interface CyclePaymentRecord {
  cycleNumber: number;
  status: 'paid' | 'late' | 'missed' | 'pending';
  date?: string;
}

export interface Cycle {
  id: string;
  committeeId: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'active' | 'upcoming';
  recipientId: string;
  recipientName: string;
  potAmount: number;
}

export interface Payment {
  id: string;
  committeeId: string;
  cycleId: string;
  memberId: string;
  memberName: string;
  expectedAmount: number;
  receivedAmount?: number;
  status: PaymentStatus;
  submittedAt?: string;
  verifiedAt?: string;
  reference?: string;
  receiptUrl?: string;
  method?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface RotationEntry {
  cycleNumber: number;
  memberId: string;
  memberName: string;
  amount: number;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

export interface AgentAction {
  id: string;
  committeeId: string;
  cycleId?: string;
  memberId?: string;
  type: AgentEventType;
  title: string;
  description: string;
  why?: string;
  outcome?: string;
  severity: EventSeverity;
  timestamp: string;
  requiresHuman: boolean;
  decisionId?: string;
}

export interface Decision {
  id: string;
  committeeId: string;
  committeeName: string;
  cycleId: string;
  cycleNumber: number;
  type: string;
  title: string;
  description: string;
  recommendation: string;
  evidence: DecisionEvidence;
  status: DecisionStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface DecisionEvidence {
  latePayments?: number;
  missedPayments?: number;
  currentContribution?: number;
  currentPot?: number;
  expectedPot?: number;
  memberName?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'decision' | 'payment' | 'cycle' | 'reminder' | 'system';
  title: string;
  description: string;
  severity: EventSeverity;
  read: boolean;
  createdAt: string;
  committeeId?: string;
  actionUrl?: string;
}

export interface AgentStatusInfo {
  status: AgentStatus;
  lastChecked: string;
  monitoringCommittee: string;
  nextCheck: string;
  actionsToday: number;
  humanDecisions: number;
}

export interface Receipt {
  id: string;
  paymentId: string;
  url: string;
  detectedAmount?: number;
  detectedDate?: string;
  detectedReference?: string;
  verified: boolean;
  uploadedAt: string;
}

export interface AppState {
  committees: Committee[];
  members: Record<string, Member[]>;
  payments: Record<string, Payment[]>;
  rotation: Record<string, RotationEntry[]>;
  agentActivity: AgentAction[];
  decisions: Decision[];
  notifications: Notification[];
  agentStatus: AgentStatusInfo;
  demoStep: number;
  isDemoMode: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
