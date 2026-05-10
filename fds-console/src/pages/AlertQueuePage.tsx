import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CreditCard, Download, Filter, PhoneCall, RefreshCw, RotateCcw, Search, Send, Smartphone, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import { useFdsStore } from '../store/useFdsStore';
import { fdsService } from '../services/fdsService';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import type { Channel, RiskLevel, TransactionStatus } from '../types/fds';
import { formatElapsed, useNowTick } from '../utils/liveTime';

const ChannelIcon = ({ channel }: { channel: Channel }) => {
  switch (channel) {
    case 'CARD': return <CreditCard className="h-4 w-4" />;
    case 'TRANSFER': return <Send className="h-4 w-4" />;
    case 'E-PAY': return <Wallet className="h-4 w-4" />;
    case 'WITHDRAWAL': return <Smartphone className="h-4 w-4" />;
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

const riskLabels: Record<RiskLevel, string> = {
  NORMAL: '낮음',
  SUSPICIOUS: '높음',
  DANGER: '위험',
};

function getStatusFilter(value: string | null): 'ALL' | TransactionStatus {
  return transactionStatuses.includes(value as TransactionStatus) ? value as TransactionStatus : 'ALL';
}

function getRiskFilter(value: string | null): 'ALL' | RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? value as RiskLevel : 'ALL';
}

const pageSize = 10;

const AlertQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, isLoading, error, fetchTransactions } = useFdsStore();
  const [page, setPage] = React.useState(1);
  const now = useNowTick();

  const searchTerm = searchParams.get('search') ?? '';
  const statusFilter = getStatusFilter(searchParams.get('status'));
  const riskFilter = getRiskFilter(searchParams.get('risk'));

  React.useEffect(() => {
    void fetchTransactions();

    let isPolling = false;
    const intervalId = window.setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await fetchTransactions({ silent: true });
      } finally {
        isPolling = false;
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [fetchTransactions]);

  const updateFilterParam = (key: string, value: string) => {
    setPage(1);
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value === 'ALL' || !value.trim()) {
      nextSearchParams.delete(key);
    } else {
      nextSearchParams.set(key, value);
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  const resetFilters = () => {
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const filteredTransactions = transactions.filter((item) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query
      || item.id.toLowerCase().includes(query)
      || item.customerId.toLowerCase().includes(query)
      || item.account.toLowerCase().includes(query)
      || String(item.amount).includes(query);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          <h2 className="fds-page-title">의심 거래</h2>
          <p className="fds-page-copy">의심 거래 목록 및 관리</p>
        </div>
        <div className="fds-row">
          <button onClick={() => fetchTransactions()} className="fds-btn fds-btn-ghost">
            <RefreshCw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
            새로고침
          </button>
          <button onClick={() => fdsService.downloadReport('csv')} className="fds-btn fds-btn-primary">
            <Download className="h-4 w-4" />
            내보내기
          </button>
        </div>
      </div>

      {error && <div className="fds-error">{error}</div>}

      <div className="fds-card fds-filter-card">
        <div className="fds-alert-filter-row">
          <div className="fds-search fds-alert-search">
            <Search className="fds-search-icon" />
            <input
              type="text"
              placeholder="검색 (거래 ID, 고객명, 계좌, 금액)"
              className="fds-input has-icon"
              value={searchTerm}
              onChange={(event) => updateFilterParam('search', event.target.value)}
            />
          </div>
          <div className="fds-alert-filter-controls">
            <Filter className="h-4 w-4 fds-dim" />
            <select className="fds-select" value={statusFilter} onChange={(event) => updateFilterParam('status', event.target.value)}>
              <option value="ALL">상태: 전체</option>
              {transactionStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
            <select className="fds-select" value={riskFilter} onChange={(event) => updateFilterParam('risk', event.target.value)}>
              <option value="ALL">위험 등급: 전체</option>
              {riskLevels.map((risk) => <option key={risk} value={risk}>{riskLabels[risk]}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="fds-btn fds-btn-ghost">
              <RotateCcw className="h-4 w-4" />
              필터 초기화
            </button>
            <span className="fds-alert-filter-count">
              {filteredTransactions.length} / {transactions.length} 건
            </span>
          </div>
        </div>
      </div>

      <div className="fds-card overflow-hidden">
        <div className="fds-table-wrap">
          <table className="fds-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>거래 ID</th>
                <th>고객명</th>
                <th>거래 유형</th>
                <th>금액</th>
                <th>위험 점수</th>
                <th>위험 등급</th>
                <th>상태</th>
                <th>처리자</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedTransactions.map((item) => (
                <tr key={item.id} className="cursor-pointer" onClick={() => navigate(`/alerts/${item.id}`)}>
                  <td className="fds-muted" title={item.occurredAt}>{formatElapsed(item.receivedAt, now)}</td>
                  <td><span className="fds-code">{item.id.slice(0, 14).toUpperCase()}</span></td>
                  <td>{item.customerId}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="fds-icon-btn !h-7 !w-7"><ChannelIcon channel={item.channel} /></span>
                      <span>{item.channel}</span>
                    </div>
                  </td>
                  <td className="font-black">₩ {item.amount.toLocaleString()}</td>
                  <td><span className={clsx('fds-badge', item.riskScore >= 61 ? 'fds-badge-danger' : item.riskScore >= 31 ? 'fds-badge-suspicious' : 'fds-badge-normal')}>{item.riskScore}</span></td>
                  <td><RiskBadge level={item.riskLevel} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      {(item.status === 'CALL_REQUIRED' || item.status === 'CALL_IN_PROGRESS') && (
                        <span className="fds-badge fds-badge-yellow flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" />
                          ARS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="fds-muted">{item.decidedAction || '-'}</td>
                  <td className="text-right"><ChevronRight className="h-4 w-4 fds-dim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagedTransactions.length === 0 && <div className="fds-empty">표시할 데이터가 없습니다.</div>}
        <div className="fds-pagination">
          <span className="mr-auto text-[12px] font-bold text-[var(--text-muted)]">
            {filteredTransactions.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredTransactions.length)}`} / {filteredTransactions.length}
          </span>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="이전 페이지">
            <ChevronLeft className="mx-auto h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'active' : ''} onClick={() => setPage(pageNumber)}>
              {pageNumber}
            </button>
          ))}
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="다음 페이지">
            <ChevronRight className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertQueuePage;
