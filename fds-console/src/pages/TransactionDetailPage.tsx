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
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { useFdsStore } from '../store/useFdsStore';
import type { AdminAction, CallVerification } from '../types/fds';
import { getAdminActionMemoError } from '../utils/memoValidation';

const actionOptions: Array<{ action: AdminAction; label: string; icon: any; className: string }> = [
  { action: 'APPROVE', label: '예외 승인', icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { action: 'HOLD', label: '관리자 보류', icon: MessageSquare, className: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' },
  { action: 'BLOCK', label: '즉시 차단', icon: XCircle, className: 'text-red-400 bg-red-500/10 hover:bg-red-500/20' },
  { action: 'REQUEST_AUTH', label: '추가 인증', icon: UserCheck, className: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' },
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
  const { selectedTransaction, isLoading, error, fetchTransactionDetail, applyAdminAction } = useFdsStore();
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [memo, setMemo] = useState('');
  const [memoError, setMemoError] = useState<string | undefined>();

  React.useEffect(() => {
    if (id) fetchTransactionDetail(id);
  }, [id, fetchTransactionDetail]);

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
    return <div className="p-12 text-center text-slate-500">거래 상세를 불러오는 중입니다.</div>;
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-slate-700" />
        <h2 className="text-xl font-bold text-slate-300">거래를 찾을 수 없습니다.</h2>
        <button onClick={() => navigate('/alerts')} className="text-blue-400 hover:underline">목록으로 돌아가기</button>
      </div>
    );
  }

  const calls = transaction.callVerifications ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/alerts')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200" aria-label="목록으로 돌아가기">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-100 font-mono">{transaction.id.slice(0, 8)}</h2>
              <StatusBadge status={transaction.status} />
            </div>
            <p className="text-slate-500 text-sm">발생 시각: {transaction.occurredAt}</p>
          </div>
        </div>
        {error && <div className="text-sm text-red-300">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="fds-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoCell label="고객" value={transaction.customerId} />
            <InfoCell label="거래 금액" value={`${transaction.amount.toLocaleString()}원`} strong />
            <InfoCell label="거래 유형" value={transaction.channel} />
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-2">위험 등급</p>
              <RiskBadge level={transaction.riskLevel} />
            </div>
          </div>

          <Panel title="AI 이상탐지 사유" icon={Bot} iconColor="text-orange-400">
            <div className="flex items-center justify-between rounded-lg border border-orange-500/10 bg-orange-500/5 px-4 py-3">
              <span className="text-sm text-slate-300">AI가 산출한 위험 점수</span>
              <span className="text-lg font-black text-orange-300">{transaction.riskScore}</span>
            </div>
            {transaction.reasonDetails.length > 0 ? transaction.reasonDetails.map((reason, index) => (
              <div key={`${reason.code}-${index}`} className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orange-400">{reason.score}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-300">{reason.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{reason.code}</p>
                </div>
              </div>
            )) : <p className="text-center py-8 text-slate-500 text-sm">탐지 사유가 없습니다.</p>}
          </Panel>

          <Panel title="ARS 고객 확인 흐름" icon={PhoneCall} iconColor="text-amber-400">
            {calls.map((call) => (
              <div key={call.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-200">{callStatusLabels[call.callStatus] ?? call.callStatus}</p>
                  <span className="text-[10px] text-slate-500">{call.verifiedAt ?? call.createdAt}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Step active={call.callStatus === 'CALL_REQUIRED' || call.callStatus === 'CALL_IN_PROGRESS'} label="AI 탐지" value="사유 안내" />
                  <Step active={call.arsResult === 'CONFIRMED'} label="1번" value="본인 거래" />
                  <Step active={call.arsResult === 'DENIED' || call.arsResult === 'NO_RESPONSE'} label="2번/무응답" value="차단/보류" />
                </div>
                <p className="text-xs text-slate-400">마스킹 번호: {call.phoneNumber}</p>
                {call.arsPrompt && (
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ARS 안내문</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{call.arsPrompt}</p>
                  </div>
                )}
                <p className="text-xs text-slate-300">{arsResultText(call)}</p>
                {call.memo && <p className="text-xs text-slate-400">{call.memo}</p>}
              </div>
            ))}
            {calls.length === 0 && <p className="text-sm text-slate-500">ARS 확인 요청이 없습니다.</p>}
          </Panel>

          <Panel title="조치 로그" icon={Clock} iconColor="text-blue-500">
            {(transaction.actionLogs ?? []).map((log) => (
              <div key={log.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-200">{log.action}</p>
                  <span className="text-xs text-slate-500">{log.createdAt}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">actor: {log.actor}</p>
                <p className="text-xs text-slate-400">status: {log.previousStatus ?? '-'} {'->'} {log.newStatus}</p>
                {log.memo && <p className="text-sm text-slate-300 mt-3">{log.memo}</p>}
              </div>
            ))}
            {(transaction.actionLogs ?? []).length === 0 && <p className="text-sm text-slate-500">저장된 조치 로그가 없습니다.</p>}
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="fds-card overflow-hidden">
            <div className="p-8 text-center border-b border-slate-700">
              <div className="w-32 h-32 rounded-full border-8 border-slate-700 mx-auto flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{transaction.riskScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Risk Score</span>
              </div>
              <p className="text-sm text-slate-400 mt-4">권장 조치: {transaction.recommendedAction}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <p className="text-slate-500">FDS 규칙</p>
                  <p className="text-slate-100 font-bold mt-1">{transaction.ruleScore}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <p className="text-slate-500">개인 패턴</p>
                  <p className="text-slate-100 font-bold mt-1">{transaction.personalScore}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow icon={Globe} label="국가/도시" value={`${transaction.countryCode} / ${transaction.city}`} />
              <InfoRow icon={Lock} label="IP" value={transaction.ip} />
              <InfoRow icon={ShieldQuestion} label="기기" value={transaction.deviceId} />
            </div>
          </div>

          <Panel title="자동 대응" icon={Zap} iconColor="text-emerald-400">
            {(transaction.responseActions ?? []).map((action) => (
              <div key={action.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-200">{action.actionType}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${action.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>{action.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{action.description}</p>
                <p className="text-[10px] text-slate-500 mt-2">target: {action.target}</p>
              </div>
            ))}
            {(transaction.responseActions ?? []).length === 0 && <p className="text-sm text-slate-500">자동 대응 이력이 없습니다.</p>}
          </Panel>

          <div className="fds-card p-6 border-blue-500/30 bg-blue-500/[0.02]">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <ShieldQuestion className="w-4 h-4 text-blue-400" />
              관리자 예외 조치
            </h3>
            <p className="text-xs text-slate-500 mb-4">ARS 결과가 없거나 운영자가 별도로 개입해야 할 때만 사용합니다.</p>
            <div className="grid grid-cols-2 gap-3">
              {actionOptions.map((option) => (
                <button key={option.action} onClick={() => setSelectedAction(option.action)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-white/5 transition-all ${option.className}`}>
                  <option.icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedAction(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md shadow-2xl p-8">
            <h4 className="text-xl font-bold text-slate-100 mb-2">예외 조치 메모 입력</h4>
            <p className="text-slate-400 text-sm mb-6">{selectedAction} 조치를 저장합니다. 감사 로그에 남을 사유를 입력하세요.</p>
            <textarea className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500" value={memo} onChange={(event) => { setMemo(event.target.value); setMemoError(undefined); }} />
            {memoError && <p className="mt-3 text-sm text-red-300">{memoError}</p>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setSelectedAction(null); setMemoError(undefined); }} className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700">취소</button>
              <button onClick={submitAction} disabled={!memo.trim() || isLoading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
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
    <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
    <p className={`text-sm mt-1 ${strong ? 'font-bold text-blue-400' : 'text-slate-200'}`}>{value}</p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
    <Icon className="w-4 h-4 text-slate-500 mt-0.5" />
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
      <p className="text-xs text-slate-300 font-mono truncate">{value}</p>
    </div>
  </div>
);

const Step = ({ active, label, value }: { active: boolean; label: string; value: string }) => (
  <div className={`rounded-lg border p-3 ${active ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-slate-800 bg-slate-950/50 text-slate-500'}`}>
    <p className="font-bold">{label}</p>
    <p className="mt-1">{value}</p>
  </div>
);

const Panel = ({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) => (
  <div className="fds-card p-6">
    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

export default TransactionDetailPage;
