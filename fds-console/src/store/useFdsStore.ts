import { create } from 'zustand';
import type { AdminAction, AuditLog, DashboardStats, PolicyRule, TransactionAlert } from '../types/fds';
import { fdsService, fetchTransactionSilent } from '../services/fdsService';

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface FetchOptions {
  silent?: boolean;
}

interface FdsState {
  transactions: TransactionAlert[];
  selectedTransaction?: TransactionAlert;
  rules: PolicyRule[];
  auditLogs: AuditLog[];
  stats: DashboardStats;
  isLoading: boolean;
  error?: string;
  arsPollingId: number | null;
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  fetchDashboard: (options?: FetchOptions) => Promise<void>;
  fetchTransactions: (options?: FetchOptions) => Promise<void>;
  fetchTransactionDetail: (id: string) => Promise<void>;
  fetchRules: () => Promise<void>;
  applyAdminAction: (id: string, action: AdminAction, memo: string) => Promise<void>;
  toggleRule: (id: string, reason: string) => Promise<void>;
  startArsPolling: (transactionId: string) => void;
  stopArsPolling: () => void;
  setCurrentUser: (user: CurrentUser) => void;
  clearAuth: () => void;
}

const emptyStats: DashboardStats = {
  totalEvaluated: 0,
  highRiskCount: 0,
  blockedCount: 0,
  challengeCount: 0,
  arsPendingCount: 0,
  avgRiskScore: 0,
  p95Latency: 0,
  normalCount: 0,
  suspiciousCount: 0,
  dangerCount: 0,
  approvedCount: 0,
  pendingReviewCount: 0,
};

function actionLogsToAuditLogs(transaction: TransactionAlert): AuditLog[] {
  return (transaction.actionLogs ?? []).map((log) => ({
    id: log.id,
    type: 'ACTION',
    actor: log.actor,
    targetId: log.transactionId,
    description: `${log.action}: ${log.previousStatus ?? '-'} -> ${log.newStatus}${log.memo ? ` / ${log.memo}` : ''}`,
    timestamp: log.createdAt,
    ruleVersion: 'rules-v1',
    scoreVersion: 'score-v1',
    ip: '-',
    deviceId: 'FDS-CONSOLE',
  }));
}

export const useFdsStore = create<FdsState>((set, get) => ({
  transactions: [],
  rules: [],
  auditLogs: [],
  stats: emptyStats,
  isLoading: false,
  arsPollingId: null,
  currentUser: null,
  isAuthenticated: !!localStorage.getItem('fds_token'),

  fetchDashboard: async (options) => {
    if (!options?.silent) {
      set({ isLoading: true, error: undefined });
    }
    try {
      const [stats, transactions] = await Promise.all([
        fdsService.getDashboardStats(),
        fdsService.getTransactions(),
      ]);
      const auditLogs = await fdsService.getAuditLogs(transactions.slice(0, 20));
      set({ stats, transactions, auditLogs, error: undefined, ...(options?.silent ? {} : { isLoading: false }) });
    } catch (error) {
      if (!options?.silent) {
        set({ error: error instanceof Error ? error.message : '데이터 조회 실패', isLoading: false });
      }
    }
  },

  fetchTransactions: async (options) => {
    if (!options?.silent) {
      set({ isLoading: true, error: undefined });
    }
    try {
      const transactions = await fdsService.getTransactions();
      set({ transactions, error: undefined, ...(options?.silent ? {} : { isLoading: false }) });
    } catch (error) {
      if (!options?.silent) {
        set({ error: error instanceof Error ? error.message : '거래 목록 조회 실패', isLoading: false });
      }
    }
  },

  fetchTransactionDetail: async (id) => {
    set({ isLoading: true, error: undefined });
    try {
      const selectedTransaction = await fdsService.getTransactionById(id);
      set((state) => ({
        selectedTransaction,
        transactions: state.transactions.map((item) => (item.id === id ? selectedTransaction : item)),
        auditLogs: [...actionLogsToAuditLogs(selectedTransaction), ...state.auditLogs.filter((log) => log.targetId !== id)],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '거래 상세 조회 실패', isLoading: false });
    }
  },

  fetchRules: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const rules = await fdsService.getPolicyRules();
      set({ rules, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '정책 규칙 조회 실패', isLoading: false });
    }
  },

  applyAdminAction: async (id, action, memo) => {
    set({ isLoading: true, error: undefined });
    try {
      const selectedTransaction = await fdsService.applyAdminAction(id, action, memo);
      const stats = await fdsService.getDashboardStats();
      set((state) => ({
        selectedTransaction,
        stats,
        transactions: state.transactions.map((item) => (item.id === id ? selectedTransaction : item)),
        auditLogs: [...actionLogsToAuditLogs(selectedTransaction), ...state.auditLogs.filter((log) => log.targetId !== id)],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '관리자 조치 실패', isLoading: false });
    }
  },

  toggleRule: async (id, reason) => {
    set({ isLoading: true, error: undefined });
    try {
      const updatedRule = await fdsService.togglePolicyRule(id, reason);
      set((state) => ({
        rules: state.rules.map((rule) => (rule.id === id ? updatedRule : rule)),
        auditLogs: [
          {
            id: `POLICY-${Date.now()}`,
            type: 'POLICY_CHANGE',
            actor: updatedRule.lastModifiedBy,
            targetId: id,
            description: `${updatedRule.enabled ? 'Enabled' : 'Disabled'} ${updatedRule.code ?? id}. Reason: ${reason}`,
            timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
            ruleVersion: 'rules-v1',
            scoreVersion: 'score-v1',
            ip: '-',
            deviceId: 'FDS-CONSOLE',
          },
          ...state.auditLogs,
        ],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '정책 변경 실패', isLoading: false });
    }
  },

  startArsPolling: (transactionId: string) => {
    const existingId = get().arsPollingId;
    if (existingId !== null) clearInterval(existingId);

    const intervalId = setInterval(async () => {
      const transaction = await fetchTransactionSilent(transactionId);
      if (!transaction) return;

      set((state) => ({
        selectedTransaction: transaction,
        transactions: state.transactions.map((item) => (item.id === transactionId ? transaction : item)),
      }));

      if (transaction.status !== 'CALL_REQUIRED' && transaction.status !== 'CALL_IN_PROGRESS') {
        clearInterval(intervalId);
        set({ arsPollingId: null });
      }
    }, 3000) as unknown as number;

    set({ arsPollingId: intervalId });
  },

  stopArsPolling: () => {
    const id = get().arsPollingId;
    if (id !== null) clearInterval(id);
    set({ arsPollingId: null });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user, isAuthenticated: true });
  },

  clearAuth: () => {
    set({ currentUser: null, isAuthenticated: false });
  },
}));
