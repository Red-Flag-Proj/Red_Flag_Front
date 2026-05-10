import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Lock,
  MessageSquare,
  MoreVertical,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  ShieldQuestion,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { useFdsStore } from '../store/useFdsStore';
import type { AdminAction, CallVerification } from '../types/fds';
import { getAdminActionMemoError } from '../utils/memoValidation';
import { requestArsCall } from '../services/fdsService';

const actionOptions: Array<{ action: AdminAction; label: string; icon: LucideIcon; accent: string }> = [
  { action: 'APPROVE', label: '승인', icon: CheckCircle2, accent: '#008a45' },
  { action: 'BLOCK', label: '차단', icon: XCircle, accent: '#ef4444' },
  { action: 'REQUEST_AUTH', label: '추가 인증', icon: PhoneCall, accent: '#f59e0b' },
  { action: 'HOLD', label: '보류', icon: MessageSquare, accent: '#2563eb' },
];

const callStatusLabels: Record<string, string> = {
  CALL_REQUIRED: 'ARS 발신 대기',
  CALL_IN_PROGRESS: 'ARS 진행 중',
  CALL_CONFIRMED: '고객 본인 확인',
  CALL_DENIED: '고객 부인',
  CALL_NO_RESPONSE: '무응답',
  CALL_HOLD: '확인 실패 보류',
};

function arsResultText(call: CallVerification) {
  if (call.arsResult === 'CONFIRMED') return '고객이 본인 거래로 확인했습니다.';
  if (call.arsResult === 'DENIED') return '고객이 본인 거래가 아니라고 응답했습니다.';
  if (call.arsResult === 'NO_RESPONSE') return '고객 확인이 없어 fail-closed 정책으로 보류됩니다.';
  return 'ARS 응답 대기 중입니다.';
}

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedTransaction, isLoading, error, fetchTransactionDetail, applyAdminAction, startArsPolling, stopArsPolling } = useFdsStore();
  const [selectedAction, setSelectedAction] = React.useState<AdminAction | null>(null);
  const [memo, setMemo] = React.useState('');
  const [memoError, setMemoError] = React.useState<string | undefined>();
  const [isArsCalling, setIsArsCalling] = React.useState(false);
  const selectedStatus = selectedTransaction?.status;

  React.useEffect(() => {
    if (id) void fetchTransactionDetail(id);
  }, [id, fetchTransactionDetail]);

  React.useEffect(() => {
    if (!id || !selectedStatus) return;
    if (selectedStatus === 'CALL_REQUIRED' || selectedStatus === 'CALL_IN_PROGRESS') {
      startArsPolling(id);
    }
    return () => stopArsPolling();
  }, [id, selectedStatus, startArsPolling, stopArsPolling]);

  const transaction = selectedTransaction;

  const submitAction = async () => {
    if (!id || !selectedAction || !memo.trim()) return;
    const validationError = getAdminActionMemoError(selectedAction, memo);
    if (validationError) {
      setMemoError(validationError);
      return;
    }
    await applyAdminAction(id, selectedAction, memo);
    setSelectedAction(null);
    setMemo('');
    setMemoError(undefined);
  };

  const callArs = async () => {
    if (!id) return;
    setIsArsCalling(true);
    try {
      await requestArsCall(id);
      await fetchTransactionDetail(id);
    } finally {
      setIsArsCalling(false);
    }
  };

  if (isLoading && !transaction) {
    return <div className="fds-empty">거래 상세를 불러오는 중입니다.</div>;
  }

  if (!transaction) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-16 w-16 fds-dim" />
        <h2 className="fds-page-title">거래를 찾을 수 없습니다.</h2>
        <button onClick={() => navigate('/alerts')} className="fds-btn fds-btn-ghost">목록으로 돌아가기</button>
      </div>
    );
  }

  const calls = transaction.callVerifications ?? [];
  const actionLogs = transaction.actionLogs ?? [];

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/alerts')} className="fds-icon-btn" aria-label="목록으로 돌아가기">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="fds-page-copy">의심 거래 &gt; 거래 상세</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="fds-page-title">거래 상세</h2>
              <RiskBadge level={transaction.riskLevel} />
              <span className="text-[13px] font-black text-[var(--danger)]">위험 점수 {transaction.riskScore}</span>
            </div>
          </div>
        </div>

        <div className="fds-row flex-wrap justify-end">
          <button className="fds-btn fds-btn-primary" onClick={() => setSelectedAction('APPROVE')}>
            <CheckCircle2 className="h-4 w-4" />
            승인
          </button>
          <button className="fds-btn fds-btn-danger" onClick={() => setSelectedAction('BLOCK')}>
            <XCircle className="h-4 w-4" />
            차단
          </button>
          <button className="fds-btn fds-btn-ghost" disabled={isArsCalling} onClick={callArs}>
            {isArsCalling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
            ARS 확인
          </button>
          <button className="fds-btn fds-btn-ghost" onClick={() => setSelectedAction('HOLD')}>
            <MoreVertical className="h-4 w-4" />
            더보기
          </button>
        </div>
      </div>

      {error && <div className="fds-error">{error}</div>}

      <div className="fds-detail-grid">
        <div className="space-y-4">
          <div className="fds-card fds-card-pad">
            <div className="fds-row-between mb-4">
              <h3 className="fds-panel-title flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[var(--primary)]" />
                거래 정보
              </h3>
              <StatusBadge status={transaction.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <InfoCell label="거래 ID" value={transaction.id} code />
              <InfoCell label="거래 시간" value={transaction.occurredAt} />
              <InfoCell label="거래 유형" value={transaction.channel} />
              <InfoCell label="거래 금액" value={`₩ ${transaction.amount.toLocaleString()}`} strong />
              <InfoCell label="결제 수단" value={transaction.paymentMethod} />
              <InfoCell label="계좌" value={transaction.account} />
              <InfoCell label="국가/도시" value={`${transaction.countryCode} / ${transaction.city}`} />
              <InfoCell label="가맹점" value={transaction.merchant} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <Panel title="고객 정보" icon={User}>
              <InfoRow label="고객 ID" value={transaction.customerId} />
              <InfoRow label="IP" value={transaction.ip} icon={Globe} />
              <InfoRow label="기기 ID" value={transaction.deviceId} icon={Lock} />
              <InfoRow label="개인 패턴 점수" value={String(transaction.personalScore)} />
            </Panel>

            <Panel title="위험 요인" icon={ShieldAlert}>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="fds-row-between">
                  <span className="text-[12px] font-black text-red-700">AI 산출 위험 점수</span>
                  <span className="text-[24px] font-black text-red-600">{transaction.riskScore}</span>
                </div>
              </div>
              {transaction.reasonDetails.length > 0 ? transaction.reasonDetails.map((reason, index) => (
                <div key={`${reason.code}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-[var(--danger)]" />
                    <div className="min-w-0">
                      <p className="m-0 text-[13px] font-bold text-[var(--text-primary)]">{reason.label}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[var(--text-muted)]">{reason.code}</p>
                    </div>
                  </div>
                  <span className="font-black text-[var(--danger)]">+{reason.score}</span>
                </div>
              )) : <p className="fds-empty">표시할 데이터가 없습니다.</p>}
            </Panel>
          </div>

          <Panel title="처리 이력" icon={Clock}>
            {actionLogs.map((log) => (
              <div key={log.id} className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 pl-5">
                <span className="absolute left-0 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
                <div className="fds-row-between">
                  <p className="m-0 text-[13px] font-black text-[var(--text-primary)]">{log.action}</p>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">{log.createdAt}</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">{log.actor} · {log.previousStatus ?? '-'} → {log.newStatus}</p>
                {log.memo && <p className="mt-2 text-[12px] font-semibold">{log.memo}</p>}
              </div>
            ))}
            {actionLogs.length === 0 && <p className="fds-empty">표시할 데이터가 없습니다.</p>}
          </Panel>

          <Panel title="ARS 고객 확인" icon={PhoneCall}>
            {calls.map((call) => (
              <div key={call.id} className="rounded-xl border border-[var(--border)] bg-white p-3">
                <div className="fds-row-between">
                  <p className="m-0 text-[13px] font-black">{callStatusLabels[call.callStatus] ?? call.callStatus}</p>
                  <span className="text-[11px] text-[var(--text-muted)]">{call.verifiedAt ?? call.createdAt}</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">마스킹 번호: {call.phoneNumber}</p>
                <p className="mt-2 text-[12px] font-semibold">{arsResultText(call)}</p>
              </div>
            ))}
            {calls.length === 0 && <p className="fds-empty">표시할 데이터가 없습니다.</p>}
          </Panel>
        </div>

        <aside className="space-y-4">
          <div className="fds-card fds-card-pad">
            <div className="fds-score-orb">
              <span className="fds-score-number">{transaction.riskScore}</span>
              <span className="text-[10px] font-black text-[var(--text-muted)]">Risk Score</span>
            </div>
            <div className="mt-5 space-y-3">
              <SummaryRow label="위험 등급" value={<RiskBadge level={transaction.riskLevel} />} />
              <SummaryRow label="현재 상태" value={<StatusBadge status={transaction.status} />} />
              <SummaryRow label="권장 조치" value={transaction.recommendedAction} />
              <SummaryRow label="관련 정보" value={`${transaction.countryCode} · ${transaction.channel}`} />
            </div>
          </div>

          <div className="fds-card fds-card-pad">
            <h3 className="fds-panel-title flex items-center gap-2">
              <ShieldQuestion className="h-4 w-4 text-[var(--primary)]" />
              관리자 조치
            </h3>
            <div className="fds-action-grid mt-4">
              {actionOptions.map((option) => (
                <button
                  key={option.action}
                  className="fds-action-btn"
                  style={{ '--accent': option.accent } as React.CSSProperties}
                  onClick={() => setSelectedAction(option.action)}
                >
                  <option.icon className="h-5 w-5" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="fds-label" htmlFor="admin-memo">메모</label>
              <textarea
                id="admin-memo"
                className="fds-textarea"
                placeholder="메모를 입력하세요..."
                value={memo}
                onChange={(event) => {
                  setMemo(event.target.value);
                  setMemoError(undefined);
                }}
              />
              {selectedAction && (
                <p className="mt-2 text-[12px] font-bold text-[var(--primary-dark)]">선택된 조치: {selectedAction}</p>
              )}
              {memoError && <p className="fds-error mt-3">{memoError}</p>}
              <button onClick={submitAction} disabled={!selectedAction || !memo.trim() || isLoading} className="fds-btn fds-btn-primary mt-4 w-full">
                {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const InfoCell = ({ label, value, strong, code }: { label: string; value: string; strong?: boolean; code?: boolean }) => (
  <div>
    <p className="fds-label">{label}</p>
    <p className={code ? 'fds-code truncate' : ''} style={{ margin: 0, color: strong ? 'var(--danger)' : 'var(--text-primary)', fontWeight: strong ? 900 : 700 }}>
      {value}
    </p>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) => (
  <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
    {Icon && <Icon className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />}
    <div className="min-w-0">
      <p className="fds-label">{label}</p>
      <p className="m-0 truncate text-[13px] font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
    <span className="text-[12px] font-bold text-[var(--text-muted)]">{label}</span>
    <span className="text-right text-[12px] font-black text-[var(--text-primary)]">{value}</span>
  </div>
);

const Panel = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) => (
  <div className="fds-card fds-card-pad">
    <h3 className="fds-panel-title mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--primary)]" />
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

export default TransactionDetailPage;
