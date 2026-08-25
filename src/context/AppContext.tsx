'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type {
  Committee,
  Member,
  Payment,
  RotationEntry,
  Decision,
  Notification,
  AgentAction,
  AgentStatusInfo,
  ToastMessage,
} from '../types';

interface AppContextValue {
  committees: Committee[];
  members: Record<string, Member[]>;
  payments: Record<string, Payment[]>;
  rotation: Record<string, RotationEntry[]>;
  agentActivity: AgentAction[];
  decisions: Decision[];
  notifications: Notification[];
  agentStatus: AgentStatusInfo;
  toasts: ToastMessage[];
  isDemoMode: boolean;
  demoStep: number;
  isLoading: boolean;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  approveDecision: (decisionId: string, resolution: string) => void;
  resolveDecision: (decisionId: string, action: string, resolution: string) => void;
  addPayment: (committeeId: string, payment: Partial<Payment>) => void;
  createCommittee: (input: {
    name: string;
    contributionAmount: number;
    frequency: string;
    totalCycles: number;
    deadline?: string;
  }) => void;
  updateCommittee: (
    committeeId: string,
    input: Partial<{ name: string; contributionAmount: number; frequency: string; totalCycles: number; deadline: string }>,
  ) => void;
  addMember: (committeeId: string, input: { name: string; phone?: string; language?: string; contribution?: number }) => void;
  updateMember: (
    memberId: string,
    input: Partial<{ name: string; phone: string; language: string; contribution: number }>,
  ) => void;
  deleteCommittee: (committeeId: string) => void;
  deleteMember: (memberId: string) => void;
  runAgentCheck: () => Promise<void>;
  refresh: () => Promise<void>;
  advanceDemoStep: () => void;
  resetDemo: () => void;
  unreadCount: number;
  pendingDecisionsCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const emptyAgentStatus: AgentStatusInfo = {
  status: 'monitoring',
  lastChecked: 'Not yet run',
  monitoringCommittee: 'Loading…',
  nextCheck: '—',
  actionsToday: 0,
  humanDecisions: 0,
};

interface ApiState {
  committees: Committee[];
  members: Record<string, Member[]>;
  payments: Record<string, Payment[]>;
  rotation: Record<string, RotationEntry[]>;
  agentActivity: AgentAction[];
  decisions: Decision[];
  notifications: Notification[];
  agentStatus: AgentStatusInfo;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [rotation, setRotation] = useState<Record<string, RotationEntry[]>>({});
  const [agentActivity, setAgentActivity] = useState<AgentAction[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatusInfo>(emptyAgentStatus);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDemoMode] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyState = useCallback((data: ApiState) => {
    setCommittees(data.committees);
    setMembers(data.members);
    setPayments(data.payments);
    setRotation(data.rotation);
    setAgentActivity(data.agentActivity);
    setDecisions(data.decisions);
    setNotifications(data.notifications);
    setAgentStatus(data.agentStatus);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: ApiState = await res.json();
      applyState(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not load live data',
        description: error instanceof Error ? error.message : 'Check your database connection.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [applyState, addToast]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const approveDecision = useCallback(
    (decisionId: string, resolution: string) => {
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === decisionId ? { ...d, status: 'approved', resolution, resolvedAt: new Date().toISOString() } : d,
        ),
      );
      fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', resolution }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Decision recorded', description: 'Kameti will proceed with your decision.' });
          refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not save decision', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const resolveDecision = useCallback(
    (decisionId: string, action: string, resolution: string) => {
      setDecisions((prev) =>
        prev.map((d) => (d.id === decisionId ? { ...d, status: 'resolved', resolution, resolvedAt: new Date().toISOString() } : d)),
      );
      fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolution: `${action}: ${resolution}` }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Decision recorded', description: 'Kameti will proceed with your instructions.' });
          refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not save decision', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const addPayment = useCallback(
    (committeeId: string, payment: Partial<Payment>) => {
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committeeId,
          memberId: payment.memberId,
          amount: payment.receivedAmount ?? payment.expectedAmount ?? 0,
          method: payment.method,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.recorded === false) {
            throw new Error(data.reason ?? `Request failed (${res.status})`);
          }
          addToast({ type: 'success', title: 'Payment recorded', description: `${payment.memberName ?? 'Payment'} has been added.` });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not record payment', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const createCommittee = useCallback(
    (input: { name: string; contributionAmount: number; frequency: string; totalCycles: number; deadline?: string }) => {
      fetch('/api/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Committee created', description: `${input.name} has been set up. Kameti is now monitoring it.` });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not create committee', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const updateCommittee = useCallback(
    (
      committeeId: string,
      input: Partial<{ name: string; contributionAmount: number; frequency: string; totalCycles: number; deadline: string }>,
    ) => {
      fetch(`/api/committees/${committeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Committee updated', description: 'Your changes have been saved.' });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not update committee', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const addMember = useCallback(
    (committeeId: string, input: { name: string; phone?: string; language?: string; contribution?: number }) => {
      fetch(`/api/committees/${committeeId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Member added', description: `${input.name} has been added to the committee.` });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not add member', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const updateMember = useCallback(
    (memberId: string, input: Partial<{ name: string; phone: string; language: string; contribution: number }>) => {
      fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
          addToast({ type: 'success', title: 'Member updated', description: 'Your changes have been saved.' });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not update member', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const deleteCommittee = useCallback(
    (committeeId: string) => {
      fetch(`/api/committees/${committeeId}`, { method: 'DELETE' })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Request failed (${res.status})`);
          }
          addToast({ type: 'success', title: 'Committee deleted', description: 'The committee and its records have been removed.' });
          if (pathname === `/committees/${committeeId}`) {
            router.push('/committees');
          }
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not delete committee', description: error.message });
        });
    },
    [addToast, refresh, pathname, router],
  );

  const deleteMember = useCallback(
    (memberId: string) => {
      fetch(`/api/members/${memberId}`, { method: 'DELETE' })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Request failed (${res.status})`);
          }
          addToast({ type: 'success', title: 'Member removed', description: 'The member has been removed from the committee.' });
          await refresh();
        })
        .catch((error) => {
          addToast({ type: 'error', title: 'Could not remove member', description: error.message });
        });
    },
    [addToast, refresh],
  );

  const runAgentCheck = useCallback(async () => {
    addToast({ type: 'info', title: 'Running agent check…', description: 'Kameti is reviewing your committees.' });
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      addToast({ type: 'success', title: 'Agent check complete', description: 'Activity feed updated below.' });
      await refresh();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Agent check failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [addToast, refresh]);

  const advanceDemoStep = useCallback(() => {
    setDemoStep((prev) => prev + 1);
  }, []);

  const resetDemo = useCallback(() => {
    setDemoStep(0);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingDecisionsCount = decisions.filter((d) => d.status === 'pending').length;

  return (
    <AppContext.Provider
      value={{
        committees,
        members,
        payments,
        rotation,
        agentActivity,
        decisions,
        notifications,
        agentStatus,
        toasts,
        isDemoMode,
        demoStep,
        isLoading,
        addToast,
        removeToast,
        markNotificationRead,
        markAllNotificationsRead,
        approveDecision,
        resolveDecision,
        addPayment,
        createCommittee,
        updateCommittee,
        addMember,
        updateMember,
        deleteCommittee,
        deleteMember,
        runAgentCheck,
        refresh,
        advanceDemoStep,
        resetDemo,
        unreadCount,
        pendingDecisionsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
