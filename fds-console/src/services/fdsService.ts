import type { ActionLog, AdminAction, AuditLog, CallVerification, DashboardStats, PolicyRule, ResponseAction, RiskReason, TransactionAlert } from '../types/fds';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@fds.local';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'Admin1234!';

let tokenCache: string | null = localStorage.getItem('fds_token');

interface BackendReason {
  code: string;
  label: string;
  score: number;
}

interface BackendTransaction {
  id: string;
  email?: string;
  username?: string;
  user_id?: string;
  customer_ref?: string;
  customer_name?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  amount: string | number;
  occurred_at: string;
  country_code?: string;
  city?: string;
  ip_address?: string;
  device_id?: string;
  payment_method?: string;
  recipient_account?: string;
  status: TransactionAlert['status'];
  decided_action: string;
  rule_score?: number;
  personal_score?: number;
  risk_score: number;
  risk_level: TransactionAlert['riskLevel'];
  reasons: BackendReason[];
  action_logs?: BackendActionLog[];
  response_actions?: BackendResponseAction[];
  call_verifications?: BackendCallVerification[];
}

interface BackendActionLog {
  id: string;
  transaction_id: string;
  action: string;
  previous_status: TransactionAlert['status'] | null;
  new_status: TransactionAlert['status'];
  memo?: string;
  reason_snapshot: BackendReason[];
  created_at: string;
  actor_email?: string;
  actor_username?: string;
}

interface BackendPolicyRule {
  id: string;
  code: string;
  category: string;
  condition: string;
  score: number;
  maxCategoryScore: number;
  enabled: boolean;
  deploymentStatus: PolicyRule['deploymentStatus'];
  lastModifiedBy: string;
  lastModifiedAt: string;
}

interface BackendResponseAction {
  id: string;
  transaction_id: string;
  action_type: string;
  target?: string;
  status: ResponseAction['status'];
  description: string;
  created_at: string;
}

interface BackendCallVerification {
  id: string;
  transaction_id: string;
  customer_ref?: string;
  phone_number?: string;
  call_status: string;
  ars_prompt?: string;
  ars_result?: 'CONFIRMED' | 'DENIED' | 'NO_RESPONSE';
  memo?: string;
  verified_at?: string;
  created_at: string;
  twilio_call_sid?: string;
}

function toChannel(type: BackendTransaction['type']): TransactionAlert['channel'] {
  if (type === 'PAYMENT') return 'CARD';
  if (type === 'TRANSFER') return 'TRANSFER';
  if (type === 'WITHDRAWAL') return 'WITHDRAWAL';
  return 'E-PAY';
}

function recommendedAction(status: TransactionAlert['status']) {
  const labels: Record<TransactionAlert['status'], string> = {
    APPROVED: '자동 승인',
    PENDING_REVIEW: '고객 미확인 보류',
    REQUIRES_AUTH: '추가 인증 요청',
    CALL_REQUIRED: 'AI 이상탐지 ARS 확인 대기',
    CALL_IN_PROGRESS: 'ARS 확인 진행 중',
    CALL_CONFIRMED: 'ARS 1번 본인 확인',
    BLOCKED: 'ARS 2번 또는 위험 차단',
    CARD_SUSPENDED: '카드 임시 정지',
  };
  return labels[status];
}

function normalizeReasons(reasons: BackendReason[] | undefined): RiskReason[] {
  return Array.isArray(reasons) ? reasons : [];
}

function mapActionLog(row: BackendActionLog): ActionLog {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    actor: row.actor_email || row.actor_username || 'SYSTEM',
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    memo: row.memo || '',
    reasonSnapshot: normalizeReasons(row.reason_snapshot),
    createdAt: new Date(row.created_at).toLocaleString('ko-KR', { hour12: false }),
  };
}

function mapResponseAction(row: BackendResponseAction): ResponseAction {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    actionType: row.action_type,
    target: row.target || '-',
    status: row.status,
    description: row.description,
    createdAt: new Date(row.created_at).toLocaleString('ko-KR', { hour12: false }),
  };
}

function mapCallVerification(row: BackendCallVerification): CallVerification {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    customerRef: row.customer_ref || '-',
    phoneNumber: row.phone_number || '-',
    callStatus: row.call_status,
    arsPrompt: row.ars_prompt || '',
    arsResult: row.ars_result,
    memo: row.memo || '',
    verifiedAt: row.verified_at ? new Date(row.verified_at).toLocaleString('ko-KR', { hour12: false }) : undefined,
    createdAt: new Date(row.created_at).toLocaleString('ko-KR', { hour12: false }),
    twilioCallSid: row.twilio_call_sid,
  };
}

function mapAuditLog(row: ActionLog): AuditLog {
  return {
    id: row.id,
    type: 'ACTION',
    actor: row.actor,
    targetId: row.transactionId,
    description: `${row.action}: ${row.previousStatus ?? '-'} -> ${row.newStatus}${row.memo ? ` / ${row.memo}` : ''}`,
    timestamp: row.createdAt,
    ruleVersion: 'rules-v1',
    scoreVersion: 'score-v1',
    ip: '-',
    deviceId: 'FDS-CONSOLE',
  };
}

function mapTransaction(row: BackendTransaction): TransactionAlert {
  const reasons = normalizeReasons(row.reasons);
  return {
    id: row.id,
    customerId: row.customer_ref ?? row.customer_name ?? row.email ?? row.username ?? row.user_id ?? 'unknown',
    amount: Number(row.amount),
    channel: toChannel(row.type),
    riskScore: Number(row.risk_score ?? 0),
    ruleScore: Number(row.rule_score ?? row.risk_score ?? 0),
    personalScore: Number(row.personal_score ?? 0),
    riskLevel: row.risk_level,
    occurredAt: new Date(row.occurred_at).toLocaleString('ko-KR', { hour12: false }),
    primaryReasons: reasons.map((reason) => reason.label),
    reasonDetails: reasons,
    recommendedAction: recommendedAction(row.status),
    status: row.status,
    decidedAction: row.decided_action,
    merchant: row.city || row.payment_method || row.type,
    account: row.recipient_account || '-',
    ip: row.ip_address || '-',
    deviceId: row.device_id || '-',
    city: row.city || '-',
    countryCode: row.country_code || '-',
    paymentMethod: row.payment_method || '-',
    actionLogs: row.action_logs?.map(mapActionLog),
    responseActions: row.response_actions?.map(mapResponseAction),
    callVerifications: row.call_verifications?.map(mapCallVerification),
  };
}

function mapPolicyRule(row: BackendPolicyRule): PolicyRule {
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    condition: row.condition,
    score: row.score,
    maxCategoryScore: row.maxCategoryScore,
    enabled: row.enabled,
    deploymentStatus: row.deploymentStatus,
    lastModifiedBy: row.lastModifiedBy,
    lastModifiedAt: new Date(row.lastModifiedAt).toLocaleString('ko-KR', { hour12: false }),
  };
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (tokenCache) headers.set('Authorization', `Bearer ${tokenCache}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && retry) {
    await login();
    return request<T>(path, options, false);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed.' }));
    throw new Error(error.message || 'API request failed.');
  }

  return response.json() as Promise<T>;
}

export async function login(
  emailOrUsername: string = ADMIN_EMAIL,
  password: string = ADMIN_PASSWORD,
): Promise<{ token: string; user: { id: string; email: string; username: string; role: string } }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password, deviceId: 'fds-console' }),
  });

  if (!response.ok) {
    throw new Error('관리자 로그인에 실패했습니다.');
  }

  const data = await response.json();
  tokenCache = data.token;
  localStorage.setItem('fds_token', data.token);
  return data;
}

export function logout(): void {
  localStorage.removeItem('fds_token');
  tokenCache = null;
}

async function ensureAuth() {
  if (!tokenCache) {
    await login();
  }
}

export interface SimulationScenario {
  label: string;
  customerRef: string;
  customerName: string;
  phoneNumber: string;
  type: 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
  amount: number;
  occurredAt: string;
  countryCode: string;
  deviceId?: string;
  paymentMethod?: string;
  merchantCategory?: string;
  city?: string;
  ipAddress?: string;
}

export const fdsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    await ensureAuth();
    const data = await request<{ stats: Record<string, number | string> }>('/admin/stats');
    const arsPendingCount = Number(data.stats.call_required_count ?? 0);
    return {
      totalEvaluated: Number(data.stats.total_transactions),
      highRiskCount: Number(data.stats.risky_transactions),
      blockedCount: Number(data.stats.blocked_count),
      challengeCount: Number(data.stats.requires_auth_count) + arsPendingCount,
      avgRiskScore: Number(data.stats.average_risk_score),
      p95Latency: 128,
      normalCount: Number(data.stats.normal_count),
      suspiciousCount: Number(data.stats.suspicious_count),
      dangerCount: Number(data.stats.danger_count),
      approvedCount: Number(data.stats.approved_count),
      pendingReviewCount: Number(data.stats.pending_review_count),
      arsPendingCount,
    };
  },

  getTransactions: async (): Promise<TransactionAlert[]> => {
    await ensureAuth();
    const data = await request<{ transactions: BackendTransaction[] }>('/admin/suspicious-transactions');
    return data.transactions.map(mapTransaction);
  },

  getTransactionById: async (id: string): Promise<TransactionAlert> => {
    await ensureAuth();
    const data = await request<{ transaction: BackendTransaction }>(`/admin/transactions/${id}`);
    return mapTransaction(data.transaction);
  },

  applyAdminAction: async (id: string, action: AdminAction, memo: string): Promise<TransactionAlert> => {
    await ensureAuth();
    await request(`/admin/transactions/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action, memo }),
    });
    return fdsService.getTransactionById(id);
  },

  getPolicyRules: async (): Promise<PolicyRule[]> => {
    await ensureAuth();
    const data = await request<{ rules: BackendPolicyRule[] }>('/admin/policy-rules');
    return data.rules.map(mapPolicyRule);
  },

  togglePolicyRule: async (id: string, reason: string): Promise<PolicyRule> => {
    await ensureAuth();
    const data = await request<{ rule: BackendPolicyRule }>(`/admin/policy-rules/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return mapPolicyRule(data.rule);
  },

  getAuditLogs: async (transactions: TransactionAlert[]): Promise<AuditLog[]> => {
    const detailRows = await Promise.all(transactions.map((item) => fdsService.getTransactionById(item.id)));
    return detailRows.flatMap((item) => (item.actionLogs ?? []).map(mapAuditLog));
  },

  createSimulatedTransaction: async (scenario: SimulationScenario): Promise<TransactionAlert> => {
    await ensureAuth();
    const data = await request<{ transaction: BackendTransaction }>('/admin/transactions', {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
    return mapTransaction(data.transaction);
  },

  downloadReport: async (format: 'csv' | 'pdf') => {
    await ensureAuth();
    const response = await fetch(`${API_BASE_URL}/reports/fraud.${format}`, {
      headers: tokenCache ? { Authorization: `Bearer ${tokenCache}` } : undefined,
    });

    if (!response.ok) throw new Error('리포트 다운로드에 실패했습니다.');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fraud-report.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

export async function requestArsCall(transactionId: string): Promise<void> {
  await ensureAuth();
  await request(`/transactions/${transactionId}/ars-call`, { method: 'POST' });
}

export async function fetchTransactionSilent(id: string): Promise<TransactionAlert | null> {
  try {
    await ensureAuth();
    const data = await request<{ transaction: BackendTransaction }>(`/admin/transactions/${id}`);
    return mapTransaction(data.transaction);
  } catch {
    return null;
  }
}
