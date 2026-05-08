import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, CreditCard, Download, Filter, PhoneCall, RefreshCw, Search, Send, Smartphone, Wallet } from 'lucide-react';
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
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          {/* <p className="fds-kicker">// 의심 거래 큐</p> */}
          <h2 className="fds-page-title">의심 거래 큐</h2>
          <p className="fds-page-copy">위험 점수와 조치 상태를 기준으로 검토할 거래를 확인합니다.</p>
        </div>
        <div className="fds-row">
          <button onClick={fetchTransactions} className="fds-btn fds-btn-ghost">
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            새로고침
          </button>
          <button onClick={() => fdsService.downloadReport('csv')} className="fds-btn fds-btn-danger">
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {error && <div className="fds-error">{error}</div>}

      <div className="fds-card fds-card-pad">
        <div className="fds-form-row">
        <div className="fds-search">
          <Search className="fds-search-icon" />
          <input
            type="text"
            placeholder="거래 ID 또는 사용자 검색"
            className="fds-input has-icon"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="fds-row">
          <Filter className="w-4 h-4 fds-dim" />
          <select className="fds-select" value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="ALL">전체 상태</option>
            {transactionStatuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
          <select className="fds-select" value={riskFilter} onChange={handleRiskFilterChange}>
            <option value="ALL">전체 위험도</option>
            <option value="NORMAL">정상</option>
            <option value="SUSPICIOUS">의심</option>
            <option value="DANGER">위험</option>
          </select>
        </div>
        <span className="fds-kicker" style={{ margin: 0, marginLeft: 'auto', color: 'var(--text-low)' }}>
          {filteredTransactions.length} / {transactions.length} 건
        </span>
        </div>
      </div>

      <div className="fds-card overflow-hidden">
        <div className="fds-table-wrap">
          <table className="fds-table">
            <thead>
              <tr>
                <th>거래 ID / 시간</th>
                <th>사용자</th>
                <th>채널 / 위치</th>
                <th>금액</th>
                <th>점수</th>
                <th>위험도</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="cursor-pointer group" onClick={() => navigate(`/alerts/${item.id}`)}>
                  <td>
                    <span className="block fds-code">{item.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-[10px] fds-dim">{item.occurredAt}</span>
                  </td>
                  <td>{item.customerId.toUpperCase()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="fds-icon-btn" style={{ width: 28, height: 28 }}><ChannelIcon channel={item.channel} /></div>
                      <span className="fds-muted">{item.countryCode.toUpperCase()} / {item.city}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-high)', fontWeight: 600 }}>{item.amount.toLocaleString()}원</td>
                  <td>
                    <div className="flex items-center gap-3 w-32">
                      <div className="fds-gauge flex-1">
                        <div
                          className="fds-gauge-fill"
                          style={{
                            width: `${Math.min(item.riskScore, 100)}%`,
                            background: item.riskScore >= 61 ? 'var(--red-vivid)' : item.riskScore >= 31 ? 'var(--amber)' : 'var(--green)',
                          }}
                        />
                      </div>
                      <span className="fds-code" style={{ color: 'var(--text-mid)' }}>{item.riskScore}</span>
                    </div>
                  </td>
                  <td><RiskBadge level={item.riskLevel} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      {(item.status === 'CALL_REQUIRED' || item.status === 'CALL_IN_PROGRESS') && (
                        <span className="fds-badge fds-badge-suspicious fds-badge-pulse flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" />
                          ARS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right"><ChevronRight className="w-5 h-5 fds-dim group-hover:text-[var(--red-vivid)]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && <div className="fds-empty">// 표시할 데이터가 없습니다</div>}
      </div>
    </div>
  );
};

export default AlertQueuePage;
