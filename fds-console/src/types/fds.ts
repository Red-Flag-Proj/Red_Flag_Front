export type RiskLevel = 'NORMAL' | 'SUSPICIOUS' | 'DANGER';

export type TransactionStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REQUIRES_AUTH' | 'CALL_REQUIRED' | 'CALL_IN_PROGRESS' | 'CALL_CONFIRMED' | 'BLOCKED' | 'CARD_SUSPENDED';

export type AdminAction = 'APPROVE' | 'HOLD' | 'BLOCK' | 'REQUEST_AUTH' | 'CALL_APPROVE' | 'CALL_HOLD';

export type Channel = 'CARD' | 'TRANSFER' | 'E-PAY' | 'WITHDRAWAL';

export interface RiskReason {
  code: string;
  label: string;
  score: number;
}

export interface ActionLog {
  id: string;
  transactionId: string;
  actor: string;
  action: string;
  previousStatus: TransactionStatus | null;
  newStatus: TransactionStatus;
  memo: string;
  reasonSnapshot: RiskReason[];
  createdAt: string;
}

export interface ResponseAction {
  id: string;
  transactionId: string;
  actionType: string;
  target: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  createdAt: string;
}

export interface CallVerification {
  id: string;
  transactionId: string;
  customerRef: string;
  phoneNumber: string;
  callStatus: string;
  memo: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface TransactionAlert {
  id: string;
  customerId: string;
  amount: number;
  channel: Channel;
  riskScore: number;
  ruleScore: number;
  personalScore: number;
  riskLevel: RiskLevel;
  occurredAt: string;
  primaryReasons: string[];
  reasonDetails: RiskReason[];
  recommendedAction: string;
  status: TransactionStatus;
  decidedAction: string;
  merchant: string;
  account: string;
  ip: string;
  deviceId: string;
  city: string;
  countryCode: string;
  paymentMethod: string;
  actionLogs?: ActionLog[];
  responseActions?: ResponseAction[];
  callVerifications?: CallVerification[];
}

export interface PolicyRule {
  id: string;
  code?: string;
  category: string;
  condition: string;
  score: number;
  maxCategoryScore: number;
  enabled: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
  deploymentStatus: 'PENDING' | 'DEPLOYED' | 'DRAFT';
}

export interface AuditLog {
  id: string;
  type: 'EVALUATION' | 'ACTION' | 'POLICY_CHANGE' | 'ACCESS';
  actor: string;
  targetId: string;
  description: string;
  timestamp: string;
  ruleVersion: string;
  scoreVersion: string;
  ip: string;
  deviceId: string;
}

export interface DashboardStats {
  totalEvaluated: number;
  highRiskCount: number;
  blockedCount: number;
  challengeCount: number;
  avgRiskScore: number;
  p95Latency: number;
  normalCount: number;
  suspiciousCount: number;
  dangerCount: number;
  approvedCount: number;
  pendingReviewCount: number;
}
