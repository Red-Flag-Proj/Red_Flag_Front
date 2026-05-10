import React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  Activity,
  AlertTriangle,
  MoreVertical,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { useFdsStore } from '../store/useFdsStore';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { fdsService, type SimulationScenario } from '../services/fdsService';
import type { RiskLevel, TransactionAlert } from '../types/fds';

type RiskDistributionItem = {
  name: string;
  value: number;
  color: string;
};

type RechartsTooltipProps = TooltipContentProps<ValueType, NameType>;

const riskColor: Record<RiskLevel, string> = {
  DANGER: '#ef4444',
  SUSPICIOUS: '#f59e0b',
  NORMAL: '#10b981',
};

const formatAmount = (value: number) => `₩ ${value.toLocaleString()}`;

const formatTime = (value: string) => {
  const timePart = value.split(' ').at(-1) ?? value;
  return timePart.slice(0, 5);
};

const getTrendData = (transactions: TransactionAlert[]) => {
  const rows = transactions.slice(0, 28).reverse();
  if (rows.length > 0) {
    return rows.map((item, index) => ({
      time: formatTime(item.occurredAt) || `${index}:00`,
      avgRisk: Math.max(8, Math.round(item.riskScore * 0.82 + (index % 5) * 2)),
      highRisk: item.riskLevel === 'DANGER' ? 7 : item.riskLevel === 'SUSPICIOUS' ? 4 : 1,
      volume: Math.max(18, Math.round(item.amount / 600000)),
    }));
  }

  return Array.from({ length: 18 }, (_, index) => ({
    time: `${String(index).padStart(2, '0')}:00`,
    avgRisk: 28 + ((index * 7) % 36),
    highRisk: 1 + (index % 6),
    volume: 24 + ((index * 11) % 58),
  }));
};

const MetricCard = ({
  title,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  delta: string;
  icon: LucideIcon;
  accent: string;
}) => (
  <div className="fds-card fds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
    <div className="fds-row-between">
      <p className="fds-stat-label">{title}</p>
      <div className="fds-stat-icon">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <h3 className="fds-stat-value">{value}</h3>
    <p className="fds-stat-delta">{delta}</p>
    <div className="fds-sparkline" aria-hidden="true" />
  </div>
);

const TrendTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="fds-chart-tooltip">
      <div className="fds-chart-tooltip-head">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="mt-2 flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="fds-legend-square" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-black text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const RiskChartTooltip = ({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as RiskDistributionItem | undefined;
  if (!item) return null;

  return (
    <div className="fds-chart-tooltip">
      <div className="fds-chart-tooltip-head">
        <span className="fds-legend-square" style={{ backgroundColor: item.color }} />
        <span>{item.name}</span>
      </div>
      <div className="fds-chart-tooltip-value">{item.value.toLocaleString()}건</div>
    </div>
  );
};

const AlertQueuePanel = ({ transactions }: { transactions: TransactionAlert[] }) => {
  const recentAlerts = transactions.slice(0, 9);

  return (
    <aside className="fds-card fds-alert-panel">
      <div className="fds-row-between border-b border-[var(--border)] px-4 py-4">
        <div>
          <h3 className="fds-panel-title">실시간 알림 큐</h3>
          <p className="fds-page-copy">위험 거래 워치리스트</p>
        </div>
        <span className="fds-badge fds-badge-normal">{transactions.length}</span>
      </div>

      <div className="fds-row-between border-b border-[var(--border)] px-4 py-3">
        <select className="fds-select" aria-label="알림 필터">
          <option>필터</option>
          <option>위험 우선</option>
          <option>ARS 확인</option>
          <option>검토 대기</option>
        </select>
        <button className="fds-icon-btn" type="button" aria-label="알림 큐 옵션">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="fds-alert-list">
        {recentAlerts.map((item) => (
          <Link
            key={item.id}
            to={`/alerts/${item.id}`}
            className="fds-alert-item"
            style={{ '--risk-color': riskColor[item.riskLevel] } as React.CSSProperties}
          >
            <span className="fds-alert-time">{formatTime(item.occurredAt)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-black text-[var(--text-primary)]">{item.customerId}</span>
              <span className="mt-1 block truncate text-[11px] font-semibold text-[var(--text-muted)]">{item.channel}</span>
              <span className="mt-2 block text-[13px] font-black text-[var(--text-primary)]">{formatAmount(item.amount)}</span>
            </span>
            <span className="flex flex-col items-end gap-2">
              <RiskBadge level={item.riskLevel} />
              <span className="text-[12px] font-black" style={{ color: riskColor[item.riskLevel] }}>{item.riskScore}</span>
            </span>
          </Link>
        ))}
        {recentAlerts.length === 0 && <p className="fds-empty">표시할 알림이 없습니다.</p>}
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <Link to="/alerts" className="fds-btn fds-btn-ghost w-full">
          전체 알림 큐 보기
        </Link>
      </div>
    </aside>
  );
};

const DashboardPage: React.FC = () => {
  const { transactions, stats, isLoading, error, fetchDashboard } = useFdsStore();
  const [simLoading, setSimLoading] = React.useState(false);
  const [simResult, setSimResult] = React.useState<{ ok: boolean; message: string; txId?: string } | null>(null);
  const [timeframe, setTimeframe] = React.useState('1일');

  React.useEffect(() => {
    void fetchDashboard();

    let isPolling = false;
    const intervalId = window.setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await fetchDashboard({ silent: true });
      } finally {
        isPolling = false;
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [fetchDashboard]);

  const handleSimulate = async () => {
    setSimLoading(true);
    setSimResult(null);
    const scenario: SimulationScenario = {
      label: '이상거래 발생',
      customerRef: 'DEV-CUST-001',
      customerName: '이신우',
      phoneNumber: '+821065051822',
      type: 'TRANSFER',
      amount: 50000000,
      occurredAt: new Date().toISOString(),
      countryCode: 'KR',
      deviceId: `FRAUD-DEVICE-${Date.now()}`,
      paymentMethod: 'WIRE',
    };

    try {
      const tx = await fdsService.createSimulatedTransaction(scenario);
      setSimResult({ ok: true, message: `거래 생성 완료: 이신우 / 50,000,000원 / 위험점수 ${tx.riskScore}`, txId: tx.id });
      await fetchDashboard();
    } catch (e) {
      setSimResult({ ok: false, message: `거래 생성 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}` });
    } finally {
      setSimLoading(false);
      window.setTimeout(() => setSimResult(null), 4200);
    }
  };

  const chartData = getTrendData(transactions);
  const distributionData: RiskDistributionItem[] = [
    { name: '위험', value: stats.dangerCount, color: '#ef4444' },
    { name: '높음', value: stats.suspiciousCount, color: '#f59e0b' },
    { name: '보통', value: stats.pendingReviewCount, color: '#eab308' },
    { name: '낮음', value: stats.normalCount, color: '#10b981' },
  ].filter((item) => item.value > 0);
  const totalDistribution = distributionData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="fds-dashboard-grid">
      <AlertQueuePanel transactions={transactions} />

      <div className="fds-page-stack">
        <div className="fds-page-head">
          <div>
            <h2 className="fds-page-title">FDS 관리자 대시보드</h2>
            <p className="fds-page-copy">실시간 사기 위험 모니터링 및 분석</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="fds-btn fds-btn-ghost">2025.05.04 - 2025.05.04</span>
            <button onClick={() => fetchDashboard()} className="fds-btn fds-btn-ghost">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button onClick={handleSimulate} disabled={simLoading} className="fds-btn fds-btn-primary">
              {simLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              이상거래 발생
            </button>
            <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)]">
              자동 새로고침
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-[var(--primary)] p-0.5">
                <span className="h-4 w-4 translate-x-4 rounded-full bg-white shadow-sm" />
              </span>
            </span>
          </div>
        </div>

        {simResult && (
          <div className={`fds-error ${simResult.ok ? '!border-emerald-200 !bg-emerald-50 !text-emerald-700' : ''}`}>
            <span>{simResult.message}</span>
            {simResult.ok && simResult.txId && (
              <Link to={`/alerts/${simResult.txId}`} className="ml-3 font-black underline">
                거래 상세 보기
              </Link>
            )}
          </div>
        )}

        {error && <div className="fds-error">{error}</div>}

        <div className="fds-grid-5">
          <MetricCard title="전체 거래" value={stats.totalEvaluated.toLocaleString()} delta="↑ 12.4% 전일 대비" icon={Activity} accent="#10b981" />
          <MetricCard title="의심/위험 거래" value={stats.highRiskCount.toLocaleString()} delta="↑ 18.7% 전일 대비" icon={AlertTriangle} accent="#ef4444" />
          <MetricCard title="차단" value={stats.blockedCount.toLocaleString()} delta="↑ 23.1% 전일 대비" icon={ShieldOff} accent="#ef4444" />
          <MetricCard title="추가 인증(ARS/OTP)" value={stats.challengeCount.toLocaleString()} delta="↑ 9.2% 전일 대비" icon={UserCheck} accent="#f59e0b" />
          <MetricCard title="평균 위험 점수" value={stats.avgRiskScore.toFixed(1)} delta="↓ 4.1% 전일 대비" icon={ShieldCheck} accent="#10b981" />
        </div>

        <div className="fds-card fds-chart-card">
          <div className="fds-row-between mb-4">
            <div>
              <h3 className="fds-panel-title">위험 점수 추이</h3>
              <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-[var(--text-muted)]">
                <span className="flex items-center gap-2"><span className="fds-legend-square bg-[var(--success)]" />평균 위험 점수</span>
                <span className="flex items-center gap-2"><span className="fds-legend-square bg-[var(--danger)]" />고위험 거래 건수</span>
              </div>
            </div>
            <div className="fds-row">
              <div className="fds-timeframe" role="group" aria-label="차트 기간">
                {['1시간', '6시간', '12시간', '1일'].map((item) => (
                  <button key={item} type="button" className={timeframe === item ? 'active' : ''} onClick={() => setTimeframe(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <button className="fds-icon-btn" type="button" aria-label="차트 옵션">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-[284px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#e8f0eb" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#809188', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#809188', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#809188', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={(props) => <TrendTooltip {...props} />} />
                <Bar yAxisId="right" dataKey="volume" name="거래량" fill="#bdebd4" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="highRisk" name="고위험 거래 건수" fill="#fecaca" radius={[3, 3, 0, 0]} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgRisk"
                  name="평균 위험 점수"
                  stroke="#0f9f61"
                  strokeWidth={2}
                  fill="#d8f5e7"
                  dot={{ r: 2, fill: '#0f9f61' }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fds-grid-2-1">
          <div className="fds-card overflow-hidden">
            <div className="fds-row-between border-b border-[var(--border)] px-4 py-4">
              <h3 className="fds-panel-title">최근 의심 거래</h3>
              <Link to="/alerts" className="text-[12px] font-black text-[var(--primary)]">전체 보기</Link>
            </div>
            <div className="fds-table-wrap">
              <table className="fds-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>거래 ID</th>
                    <th>고객</th>
                    <th>거래 유형</th>
                    <th>금액</th>
                    <th>위험 점수</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((alert) => (
                    <tr key={alert.id}>
                      <td className="fds-muted">{formatTime(alert.occurredAt)}</td>
                      <td>
                        <Link to={`/alerts/${alert.id}`} className="fds-code">{alert.id.slice(0, 12).toUpperCase()}</Link>
                      </td>
                      <td>{alert.customerId}</td>
                      <td>{alert.channel}</td>
                      <td className="font-black">{formatAmount(alert.amount)}</td>
                      <td><span className="fds-badge fds-badge-danger">{alert.riskScore}</span></td>
                      <td><StatusBadge status={alert.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="fds-empty">표시할 데이터가 없습니다.</p>}
            </div>
          </div>

          <div className="fds-card fds-card-pad">
            <h3 className="fds-panel-title">위험 등급 분포</h3>
            <div className="relative mt-3 h-[244px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip cursor={false} content={(props) => <RiskChartTooltip {...props} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">총 거래</span>
                <span className="text-[24px] font-black text-[var(--text-primary)]">{totalDistribution.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-[12px] font-bold">
                  <span className="flex items-center gap-2">
                    <span className="fds-legend-square" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span>{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-semibold text-[var(--text-faint)]">
          최근 업데이트: 10:33:02 · 데이터 기준: KST
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
