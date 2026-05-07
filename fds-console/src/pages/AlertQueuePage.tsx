import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, CreditCard, Download, Filter, RefreshCw, Search, Send, Smartphone, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import { useFdsStore } from '../store/useFdsStore';
import { fdsService } from '../services/fdsService';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import type { Channel, RiskLevel, TransactionStatus } from '../types/fds';

const ChannelIcon = ({ channel }: { channel: Channel }) => {
  switch (channel) {
    case 'CARD': return <CreditCard className="w-4 h-4" />;
    case 'TRANSFER': return <Send className="w-4 h-4" />;
    case 'E-PAY': return <Wallet className="w-4 h-4" />;
    case 'WITHDRAWAL': return <Smartphone className="w-4 h-4" />;
  }
};

const transactionStatuses: TransactionStatus[] = [
  'APPROVED',
  'PENDING_REVIEW',
  'REQUIRES_AUTH',
  'CALL_REQUIRED',
  'CALL_IN_PROGRESS',
  'CALL_CONFIRMED',
  'BLOCKED',
  'CARD_SUSPENDED',
];

const riskLevels: RiskLevel[] = ['NORMAL', 'SUSPICIOUS', 'DANGER'];

const statusLabels: Record<TransactionStatus, string> = {
  APPROVED: '승인',
  PENDING_REVIEW: '검토 대기',
  REQUIRES_AUTH: '추가 인증',
  CALL_REQUIRED: 'ARS 확인 대기',
  CALL_IN_PROGRESS: 'ARS 진행 중',
  CALL_CONFIRMED: 'ARS 본인 확인',
  BLOCKED: '차단',
  CARD_SUSPENDED: '카드 정지',
};

function getStatusFilter(value: string | null): 'ALL' | TransactionStatus {
  return transactionStatuses.includes(value as TransactionStatus) ? value as TransactionStatus : 'ALL';
}

function getRiskFilter(value: string | null): 'ALL' | RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? value as RiskLevel : 'ALL';
}

const AlertQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, isLoading, error, fetchTransactions } = useFdsStore();
  const urlSearchTerm = searchParams.get('search') ?? '';
  const urlStatusFilter = getStatusFilter(searchParams.get('status'));
  const urlRiskFilter = getRiskFilter(searchParams.get('risk'));
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>(urlStatusFilter);
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>(urlRiskFilter);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  React.useEffect(() => {
    setSearchTerm(urlSearchTerm);
    setStatusFilter(urlStatusFilter);
    setRiskFilter(urlRiskFilter);
  }, [urlRiskFilter, urlSearchTerm, urlStatusFilter]);

  const updateFilterParam = (key: string, value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === 'ALL' || !value.trim()) {
      nextSearchParams.delete(key);
    } else {
      nextSearchParams.set(key, value);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSearchTerm = event.target.value;

    setSearchTerm(nextSearchTerm);
    updateFilterParam('search', nextSearchTerm);
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatusFilter = event.target.value as 'ALL' | TransactionStatus;

    setStatusFilter(nextStatusFilter);
    updateFilterParam('status', nextStatusFilter);
  };

  const handleRiskFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRiskFilter = event.target.value as 'ALL' | RiskLevel;

    setRiskFilter(nextRiskFilter);
    updateFilterParam('risk', nextRiskFilter);
  };

  const filteredTransactions = transactions.filter((item) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = item.id.toLowerCase().includes(query) || item.customerId.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">의심 거래 큐</h2>
          <p className="text-slate-500 text-sm">위험 점수와 조치 상태를 기준으로 검토할 거래를 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTransactions} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm">
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            새로고침
          </button>
          <button onClick={() => fdsService.downloadReport('csv')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm">
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>}

      <div className="fds-card p-4 bg-slate-900/50 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="거래 ID 또는 사용자 검색"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-200"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200" value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="ALL">전체 상태</option>
            {transactionStatuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
          <select className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200" value={riskFilter} onChange={handleRiskFilterChange}>
            <option value="ALL">전체 위험도</option>
            <option value="NORMAL">정상</option>
            <option value="SUSPICIOUS">의심</option>
            <option value="DANGER">위험</option>
          </select>
        </div>
      </div>

      <div className="fds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">거래 ID / 시간</th>
                <th className="py-4 px-4">사용자</th>
                <th className="py-4 px-4">채널 / 위치</th>
                <th className="py-4 px-4">금액</th>
                <th className="py-4 px-4">점수</th>
                <th className="py-4 px-4">위험도</th>
                <th className="py-4 px-4">상태</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-all cursor-pointer group" onClick={() => navigate(`/alerts/${item.id}`)}>
                  <td className="py-4 px-4">
                    <span className="block font-mono text-blue-400 font-medium">{item.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-slate-500">{item.occurredAt}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300">{item.customerId}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-800 rounded text-slate-400"><ChannelIcon channel={item.channel} /></div>
                      <span className="text-sm text-slate-400">{item.countryCode} / {item.city}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-slate-200">{item.amount.toLocaleString()}원</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={clsx('h-full rounded-full', item.riskScore >= 61 ? 'bg-red-500' : item.riskScore >= 31 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(item.riskScore, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4"><RiskBadge level={item.riskLevel} /></td>
                  <td className="py-4 px-4"><StatusBadge status={item.status} /></td>
                  <td className="py-4 px-4 text-right"><ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && <div className="p-12 text-center text-slate-500 text-sm">조건에 맞는 거래가 없습니다.</div>}
      </div>
    </div>
  );
};

export default AlertQueuePage;
