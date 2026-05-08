import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  ShieldQuestion,
  UserCheck,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { useFdsStore } from '../store/useFdsStore';
import type { AdminAction, CallVerification } from '../types/fds';
import { getAdminActionMemoError } from '../utils/memoValidation';
import { requestArsCall } from '../services/fdsService';

const actionOptions: Array<{ action: AdminAction; label: string; icon: LucideIcon; accent: string }> = [
  { action: 'APPROVE', label: '예외 승인', icon: CheckCircle2, accent: '#00e676' },
  { action: 'HOLD', label: '관리자 보류', icon: MessageSquare, accent: '#3b7fff' },
  { action: 'BLOCK', label: '즉시 차단', icon: XCircle, accent: '#ff2c3d' },
  { action: 'REQUEST_AUTH', label: '추가 인증', icon: UserCheck, accent: '#f5a623' },
];

const callStatusLabels: Record<string, string> = {
  CALL_REQUIRED: 'ARS 발신 대기',
  CALL_IN_PROGRESS: 'ARS 진행 중',
  CALL_CONFIRMED: '고객 1번 입력',
  CALL_DENIED: '고객 2번 입력',
  CALL_NO_RESPONSE: '무응답 보류',
  CALL_HOLD: '확인 실패 보류',
};

function arsResultText(call: CallVerification) {
  if (call.arsResult === 'CONFIRMED') return '고객이 1번을 눌러 본인 거래로 확인했습니다.';
  if (call.arsResult === 'DENIED') return '고객이 2번을 눌러 본인 거래가 아니라고 응답했습니다.';
  if (call.arsResult === 'NO_RESPONSE') return '고객 확인이 없어 fail-closed 정책으로 보류됩니다.';
  return 'ARS 응답 대기 중입니다. 고객이 맞으면 1번, 아니면 2번을 누르게 됩니다.';
}

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedTransaction, isLoading, error, fetchTransactionDetail, applyAdminAction, startArsPolling, stopArsPolling } = useFdsStore();
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [memo, setMemo] = useState('');
  const [memoError, setMemoError] = useState<string | undefined>();
  const [isArsCalling, setIsArsCalling] = useState(false);

  React.useEffect(() => {
    if (id) fetchTransactionDetail(id);
  }, [id, fetchTransactionDetail]);

  React.useEffect(() => {
    if (!id || !selectedTransaction) return;
    if (selectedTransaction.status === 'CALL_REQUIRED' || selectedTransaction.status === 'CALL_IN_PROGRESS') {
      startArsPolling(id);
    }
    return () => stopArsPolling();
  }, [id, selectedTransaction?.status, startArsPolling, stopArsPolling]);

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

  if (isLoading && !transaction) {
    return <div className="fds-empty">거래 상세를 불러오는 중입니다.</div>;
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 fds-dim" />
        <h2 className="fds-page-title">거래를 찾을 수 없습니다.</h2>
        <button onClick={() => navigate('/alerts')} className="fds-btn fds-btn-ghost">목록으로 돌아가기</button>
      </div>
    );
  }

  const calls = transaction.callVerifications ?? [];

  return (
    <div className="fds-page-stack max-w-7xl mx-auto">
      <div className="fds-page-head">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/alerts')} className="fds-icon-btn" aria-label="목록으로 돌아가기">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            {/* <p className="fds-kicker">// 거래 상세</p> */}
            <div className="flex items-center gap-3">
              <h2 className="fds-page-title fds-code" style={{ fontSize: 22 }}>{transaction.id.slice(0, 8).toUpperCase()}</h2>
              <StatusBadge status={transaction.status} />
            </div>
            <p className="fds-page-copy">발생 시각: {transaction.occurredAt}</p>
          </div>
        </div>
        {error && <div className="fds-error">{error}</div>}
      </div>

      <div className="fds-detail-grid">
        <div className="space-y-5">
          <div className="fds-card fds-card-pad grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoCell label="고객" value={transaction.customerId} />
            <InfoCell label="거래 금액" value={`${transaction.amount.toLocaleString()}원`} strong />
            <InfoCell label="거래 유형" value={transaction.channel} />
            <div>
              <p className="fds-label">위험 등급</p>
              <RiskBadge level={transaction.riskLevel} />
            </div>
          </div>

          <Panel title="AI 이상탐지 사유" icon={Bot} iconColor="text-[var(--amber)]">
            <div className="fds-row-between" style={{ border: '1px solid rgba(245,166,35,0.16)', background: 'rgba(245,166,35,0.05)', borderRadius: 3, padding: '12px 14px' }}>
              <span>AI가 산출한 위험 점수</span>
              <span className="fds-code" style={{ color: 'var(--amber)', fontSize: 18 }}>{transaction.riskScore}</span>
            </div>
            {transaction.reasonDetails.length > 0 ? transaction.reasonDetails.map((reason, index) => (
              <div key={`${reason.code}-${index}`} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-[3px]">
                <div className="w-8 h-8 rounded-[3px] bg-[rgba(245,166,35,0.1)] flex items-center justify-center flex-shrink-0">
                  <span className="fds-code" style={{ color: 'var(--amber)' }}>{reason.score}</span>
                </div>
                <div>
                  <p style={{ margin: 0 }}>{reason.label}</p>
                  <p className="fds-code" style={{ marginTop: 4, color: 'var(--text-dim)' }}>{reason.code.toUpperCase()}</p>
                </div>
              </div>
            )) : <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
          </Panel>

          <Panel title="ARS 고객 확인 흐름" icon={PhoneCall} iconColor="text-[var(--amber)]">
            {(transaction.status === 'CALL_REQUIRED' || transaction.status === 'CALL_IN_PROGRESS') && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-[3px] border border-[rgba(59,127,255,0.2)] bg-[rgba(59,127,255,0.05)] animate-pulse">
                <PhoneCall className="w-4 h-4 text-[var(--blue)] flex-shrink-0" />
                <p style={{ margin: 0, color: '#7fabff', fontSize: 13 }}>고객 응답 대기 중...</p>
              </div>
            )}
            {calls.map((call) => (
              <div key={call.id} className="p-4 bg-white/[0.02] rounded-[3px] border border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p style={{ margin: 0, color: 'var(--text-high)', fontWeight: 700 }}>{callStatusLabels[call.callStatus] ?? call.callStatus}</p>
                    <ArsStatusBadge callStatus={call.callStatus} />
                  </div>
                  <span className="text-[10px] fds-dim">{call.verifiedAt ?? call.createdAt}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Step active={call.callStatus === 'CALL_REQUIRED' || call.callStatus === 'CALL_IN_PROGRESS'} label="AI 탐지" value="사유 안내" />
                  <Step active={call.arsResult === 'CONFIRMED'} label="1번" value="본인 거래" />
                  <Step active={call.arsResult === 'DENIED' || call.arsResult === 'NO_RESPONSE'} label="2번/무응답" value="차단/보류" />
                </div>
                <p className="text-xs fds-muted">마스킹 번호: {call.phoneNumber}</p>
                {call.arsPrompt && (
                  <div className="rounded-[3px] bg-black/20 border border-white/[0.04] p-3">
                    <p className="fds-label">ARS 안내문</p>
                    <p className="text-xs leading-relaxed">{call.arsPrompt}</p>
                  </div>
                )}
                <p className="text-xs">{arsResultText(call)}</p>
                {call.memo && <p className="text-xs fds-muted">{call.memo}</p>}
                {(call.callStatus === 'CALL_NO_RESPONSE' || call.callStatus === 'CALL_REQUIRED') && (
                  <button
                    disabled={isArsCalling}
                    onClick={async () => {
                      if (!id) return;
                      setIsArsCalling(true);
                      try {
                        await requestArsCall(id);
                        await fetchTransactionDetail(id);
                      } finally {
                        setIsArsCalling(false);
                      }
                    }}
                    className="fds-btn fds-btn-danger"
                  >
                    {isArsCalling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PhoneCall className="w-3 h-3" />}
                    ARS 재발신
                  </button>
                )}
              </div>
            ))}
            {calls.length === 0 && <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
          </Panel>

          <Panel title="조치 로그" icon={Clock} iconColor="text-[var(--blue)]">
            {(transaction.actionLogs ?? []).map((log) => (
              <div key={log.id} className="p-4 bg-white/[0.02] rounded-[3px] border border-white/[0.04]">
                <div className="flex items-center justify-between gap-4">
                  <p className="fds-code" style={{ margin: 0 }}>{log.action}</p>
                  <span className="text-xs fds-dim">{log.createdAt}</span>
                </div>
                <p className="text-xs fds-muted mt-2">actor: {log.actor}</p>
                <p className="text-xs fds-muted">status: {log.previousStatus ?? '-'} {'->'} {log.newStatus}</p>
                {log.memo && <p className="text-sm mt-3">{log.memo}</p>}
              </div>
            ))}
            {(transaction.actionLogs ?? []).length === 0 && <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
          </Panel>
        </div>

        <div className="space-y-5">
          <div className="fds-card overflow-hidden">
            <div className="p-8 text-center border-b border-white/[0.04]">
              <div className="fds-score-orb">
                <span className="fds-score-number">{transaction.riskScore}</span>
                <span className="fds-kicker" style={{ margin: 0, color: 'var(--text-dim)', fontSize: 9 }}>Risk Score</span>
              </div>
              <p className="fds-page-copy" style={{ marginTop: 16 }}>권장 조치: {transaction.recommendedAction}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-[3px] bg-white/[0.02] border border-white/[0.04]">
                  <p className="fds-label">FDS 규칙</p>
                  <p className="fds-code" style={{ color: 'var(--text-high)' }}>{transaction.ruleScore}</p>
                </div>
                <div className="p-3 rounded-[3px] bg-white/[0.02] border border-white/[0.04]">
                  <p className="fds-label">개인 패턴</p>
                  <p className="fds-code" style={{ color: 'var(--text-high)' }}>{transaction.personalScore}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow icon={Globe} label="국가/도시" value={`${transaction.countryCode} / ${transaction.city}`} />
              <InfoRow icon={Lock} label="IP" value={transaction.ip} />
              <InfoRow icon={ShieldQuestion} label="기기" value={transaction.deviceId} />
            </div>
          </div>

          <Panel title="자동 대응" icon={Zap} iconColor="text-[var(--green)]">
            {(transaction.responseActions ?? []).map((action) => (
              <div key={action.id} className="p-3 bg-white/[0.02] rounded-[3px] border border-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <p className="fds-code" style={{ margin: 0 }}>{action.actionType}</p>
                  <span className={`fds-badge ${action.status === 'COMPLETED' ? 'fds-badge-normal' : 'fds-badge-suspicious'}`}>{action.status}</span>
                </div>
                <p className="text-xs fds-muted mt-2">{action.description}</p>
                <p className="text-[10px] fds-dim mt-2">target: {action.target}</p>
              </div>
            ))}
            {(transaction.responseActions ?? []).length === 0 && <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
          </Panel>

          <div className="fds-card fds-card-pad" style={{ borderColor: 'rgba(59,127,255,0.22)', background: 'rgba(59,127,255,0.02)' }}>
            <h3 className="fds-panel-title mb-4 flex items-center gap-2">
              <ShieldQuestion className="w-4 h-4 text-[var(--blue)]" />
              관리자 예외 조치
            </h3>
            <p className="fds-panel-subtitle mb-4">ARS 결과가 없거나 운영자가 별도로 개입해야 할 때만 사용합니다.</p>
            <div className="fds-action-grid">
              {actionOptions.map((option) => (
                <button
                  key={option.action}
                  onClick={() => setSelectedAction(option.action)}
                  className="fds-action-btn"
                  style={{ '--accent': option.accent } as React.CSSProperties}
                >
                  <option.icon className="w-5 h-5" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedAction && (
        <div className="fds-modal">
          <div className="fds-modal-backdrop" onClick={() => setSelectedAction(null)} />
          <div className="fds-modal-panel">
            <h4 className="fds-panel-title">예외 조치 메모 입력</h4>
            <p className="fds-panel-subtitle" style={{ marginBottom: 18 }}>{selectedAction} 조치를 저장합니다. 감사 로그에 남을 사유를 입력하세요.</p>
            <textarea className="fds-textarea" value={memo} onChange={(event) => { setMemo(event.target.value); setMemoError(undefined); }} />
            {memoError && <p className="fds-error mt-3">{memoError}</p>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setSelectedAction(null); setMemoError(undefined); }} className="fds-btn fds-btn-ghost flex-1">취소</button>
              <button onClick={submitAction} disabled={!memo.trim() || isLoading} className="fds-btn fds-btn-primary flex-1">
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCell = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div>
    <p className="fds-label">{label}</p>
    <p className={strong ? 'fds-code' : ''} style={{ margin: 0, color: strong ? 'var(--red-vivid)' : 'var(--text-mid)', fontWeight: strong ? 700 : 500 }}>
      {strong ? value.toUpperCase() : value}
    </p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-[3px] border border-white/[0.04]">
    <Icon className="w-4 h-4 fds-dim mt-0.5" />
    <div className="min-w-0">
      <p className="fds-label">{label}</p>
      <p className="fds-code truncate" style={{ color: 'var(--text-mid)' }}>{value.toUpperCase()}</p>
    </div>
  </div>
);

const Step = ({ active, label, value }: { active: boolean; label: string; value: string }) => (
  <div
    className="rounded-[3px] border p-3"
    style={{
      borderColor: active ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.04)',
      background: active ? 'rgba(245,166,35,0.08)' : 'rgba(5,6,8,0.36)',
      color: active ? '#ffc35a' : 'var(--text-dim)',
    }}
  >
    <p style={{ margin: 0, fontWeight: 700 }}>{label}</p>
    <p style={{ margin: '4px 0 0' }}>{value}</p>
  </div>
);

const arsStatusBadgeConfig: Record<string, { label: string; className: string; pulse?: boolean }> = {
  CALL_REQUIRED: { label: 'ARS 발신 대기', className: 'fds-badge-suspicious' },
  CALL_IN_PROGRESS: { label: '통화 중', className: 'fds-badge-blue', pulse: true },
  CALL_CONFIRMED: { label: '고객 1번 확인', className: 'fds-badge-normal' },
  CALL_DENIED: { label: '고객 2번 거부', className: 'fds-badge-danger' },
  CALL_NO_RESPONSE: { label: '무응답 보류', className: 'fds-badge-dim' },
};

const ArsStatusBadge = ({ callStatus }: { callStatus: string }) => {
  const config = arsStatusBadgeConfig[callStatus];
  if (!config) return null;
  return (
    <span className={`fds-badge ${config.className} ${config.pulse ? 'fds-badge-pulse' : ''}`}>
      {config.label}
    </span>
  );
};

const Panel = ({ title, icon: Icon, iconColor, children }: { title: string; icon: LucideIcon; iconColor: string; children: React.ReactNode }) => (
  <div className="fds-card fds-card-pad">
    <h3 className="fds-panel-title mb-4 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

export default TransactionDetailPage;
