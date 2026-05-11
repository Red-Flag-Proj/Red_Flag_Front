import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, RefreshCw, ShieldOff, UserCheck, type LucideIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { fdsService, type SimulationScenario } from '../services/fdsService';
import { useFdsStore } from '../store/useFdsStore';
import type { DashboardStats, RiskLevel, TransactionAlert } from '../types/fds';
import { formatElapsed, useNowTick } from '../utils/liveTime';

const riskColor: Record<RiskLevel, string> = {
  DANGER: '#ef4444',
  SUSPICIOUS: '#f59e0b',
  NORMAL: '#10b981',
};

const formatAmount = (value: number) => value.toLocaleString();

const riskLabel: Record<RiskLevel, string> = {
  NORMAL: '정상',
  SUSPICIOUS: '의심',
  DANGER: '위험',
};

const riskAccent: Record<RiskLevel, string> = {
  NORMAL: '#10b981',
  SUSPICIOUS: '#f59e0b',
  DANGER: '#ef4444',
};

type RiskDistributionItem = {
  name: string;
  value: number;
  color: string;
};

type RechartsTooltipProps = TooltipContentProps<ValueType, NameType>;

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

const DistributionTooltip = ({ active, payload }: RechartsTooltipProps) => {
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

const RadarBoard = ({ transactions, stats, now }: { transactions: TransactionAlert[]; stats: DashboardStats; now: number }) => {
  const latest = transactions[0];
  const riskRows = [
    { key: 'NORMAL' as const, label: '정상', value: stats.normalCount, color: riskAccent.NORMAL },
    { key: 'SUSPICIOUS' as const, label: '의심', value: stats.suspiciousCount, color: riskAccent.SUSPICIOUS },
    { key: 'DANGER' as const, label: '위험', value: stats.dangerCount, color: riskAccent.DANGER },
  ];
  const total = Math.max(1, stats.totalEvaluated);
  return (
    <div className="fds-card fds-flow-stage">
      <div className="fds-row-between border-b border-[var(--border)] px-4 py-4">
        <div>
          <h3 className="fds-panel-title">Signal Index</h3>
          <p className="fds-panel-subtitle">거래 신호를 밀도감 있게 압축한 흐름 패널입니다.</p>
        </div>
        <div className="fds-row">
          <span className="fds-badge fds-badge-normal">{stats.totalEvaluated.toLocaleString()}건</span>
        </div>
      </div>

      <div className="fds-flow-shell">
        <div className="fds-flow-hud">
          <span>STREAM {now % 2 === 0 ? 'ACTIVE' : 'HOLD'}</span>
          <span>HIGHRISK {stats.highRiskCount.toLocaleString()}</span>
          <span>{latest ? `${riskLabel[latest.riskLevel]} · ${formatElapsed(latest.receivedAt, now)}` : 'NO TARGET'}</span>
        </div>

        <div className="fds-flow-board">
          {riskRows.map((row) => {
            const pct = Math.max(4, Math.round((row.value / total) * 100));
            return (
              <div key={row.key} className="fds-flow-row">
                <div className="fds-flow-label">
                  <span className="fds-flow-dot" style={{ backgroundColor: row.color }} />
                  <span>{row.label}</span>
                </div>
                <div className="fds-flow-track">
                  <span className="fds-flow-track-grid" />
                  <div className="fds-flow-fill" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                </div>
                <div className="fds-flow-meta">
                  <strong>{row.value.toLocaleString()}</strong>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fds-flow-foot">
          <div>
            <span className="fds-flow-foot-label">TARGET</span>
            <strong>{latest ? latest.customerId : 'NONE'}</strong>
          </div>
          <div>
            <span className="fds-flow-foot-label">VALUE</span>
            <strong>{latest ? formatAmount(latest.amount) : '0'}</strong>
          </div>
          <div>
            <span className="fds-flow-foot-label">RISK</span>
            <strong>{latest ? latest.riskScore : 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertQueuePanel = ({ transactions, now }: { transactions: TransactionAlert[]; now: number }) => (
  <aside className="fds-card fds-alert-panel">
    <div className="fds-row-between border-b border-[var(--border)] px-4 py-4">
      <div>
        <h3 className="fds-panel-title">실시간 수신 거래</h3>
        <p className="fds-page-copy">백엔드 API로 들어온 거래를 순서대로 표시합니다.</p>
      </div>
      <span className="fds-badge fds-badge-normal">{transactions.length}</span>
    </div>

    <div className="fds-alert-list">
      {transactions.slice(0, 9).map((item) => (
        <Link
          key={item.id}
          to={`/alerts/${item.id}`}
          className="fds-alert-item"
          style={{ '--risk-color': riskColor[item.riskLevel] } as React.CSSProperties}
        >
          <span className="fds-alert-time">{formatElapsed(item.receivedAt, now)}</span>
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
      {transactions.length === 0 && <p className="fds-empty">?섏떊 ?湲?以묒엯?덈떎.</p>}
    </div>

    <div className="border-t border-[var(--border)] p-4">
      <Link to="/alerts" className="fds-btn fds-btn-ghost w-full">
        전체 거래 보기
      </Link>
    </div>
  </aside>
);

const DashboardPage: React.FC = () => {
  const { transactions, stats, isLoading, error, fetchDashboard } = useFdsStore();
  const now = useNowTick();
  const [simLoading, setSimLoading] = React.useState(false);
  const [simResult, setSimResult] = React.useState<{ ok: boolean; message: string; txId?: string } | null>(null);
  const distributionData: RiskDistributionItem[] = [
    { name: '위험', value: stats.dangerCount, color: riskAccent.DANGER },
    { name: '의심', value: stats.suspiciousCount, color: riskAccent.SUSPICIOUS },
    { name: '정상', value: stats.normalCount, color: riskAccent.NORMAL },
  ];
  const totalDistribution = Math.max(1, stats.totalEvaluated);

  const [currentKstTime, setCurrentKstTime] = React.useState(
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
  );

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentKstTime(
        new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

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
      label: '이상 거래 생성',
      customerRef: 'DEV-CUST-001',
      customerName: '홍길동',
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
      setSimResult({ ok: true, message: `거래 생성 완료: 이상 송금 / 50,000,000원 / 위험점수 ${tx.riskScore}`, txId: tx.id });
      await fetchDashboard();
    } catch (e) {
      setSimResult({ ok: false, message: `거래 생성 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}` });
    } finally {
      setSimLoading(false);
      window.setTimeout(() => setSimResult(null), 4200);
    }
  };

  return (
    <div className="fds-dashboard-grid">
      <AlertQueuePanel transactions={transactions} now={now} />

      <div className="fds-page-stack">
        <div className="fds-page-head">
          <div>
            <h2 className="fds-page-title">FDS 관제 대시보드</h2>
            <p className="fds-page-copy">AI Engine에서 생성된 데이터를 백엔드 API로 받아 표시합니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button onClick={() => fetchDashboard()} className="fds-btn fds-btn-ghost">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button onClick={handleSimulate} disabled={simLoading} className="fds-btn fds-btn-primary">
              {simLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              이상 거래 생성
            </button>
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
            <MetricCard title="전체 거래" value={stats.totalEvaluated.toLocaleString()} delta="백엔드 API 수신" icon={Activity} accent="#10b981" />
            <MetricCard title="위험/의심" value={stats.highRiskCount.toLocaleString()} delta="AI 판정 결과" icon={AlertTriangle} accent="#ef4444" />
            <MetricCard title="차단" value={stats.blockedCount.toLocaleString()} delta="BLOCKED 상태" icon={ShieldOff} accent="#ef4444" />
            <MetricCard title="카드 정지" value={stats.cardSuspendedCount.toLocaleString()} delta="CARD_SUSPENDED 상태" icon={ShieldOff} accent="#7c3aed" />
            <MetricCard title="본인인증" value={stats.requiresAuthCount.toLocaleString()} delta="REQUIRES_AUTH 상태" icon={UserCheck} accent="#f59e0b" />
            <MetricCard title="ARS 확인" value={stats.callRequiredCount.toLocaleString()} delta="CALL_REQUIRED 상태" icon={UserCheck} accent="#2563eb" />
        </div>

        <RadarBoard transactions={transactions} stats={stats} now={now} />

        <div className="fds-grid-2-1">
          <div className="fds-card overflow-hidden">
            <div className="fds-row-between border-b border-[var(--border)] px-4 py-4">
              <h3 className="fds-panel-title">최근 수신 거래</h3>
              <Link to="/alerts" className="text-[12px] font-black text-[var(--primary)]">전체 보기</Link>
            </div>
            <div className="fds-table-wrap">
              <table className="fds-table">
                <thead>
                  <tr>
                      <th>수신</th>
                      <th>거래 ID</th>
                    <th>고객</th>
                    <th>유형</th>
                    <th>금액</th>
                    <th>점수</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((alert) => (
                    <tr key={alert.id}>
                      <td className="fds-muted">{formatElapsed(alert.receivedAt, now)}</td>
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
                {transactions.length === 0 && <p className="fds-empty">수신 대기 중입니다.</p>}
            </div>
          </div>

          <div className="fds-card fds-card-pad">
            <div className="fds-row-between">
              <div>
                <h3 className="fds-panel-title">위험 분포</h3>
                <p className="fds-panel-subtitle">전체 거래의 위험 등급 비중을 도넛 그래프로 보여줍니다.</p>
              </div>
              <span className="fds-badge fds-badge-dim">{totalDistribution.toLocaleString()}건</span>
            </div>
            <div className="mt-3 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    isAnimationActive={false}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip cursor={false} content={(props) => <DistributionTooltip {...props} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="fds-radar-legend">
              {distributionData.map((item) => {
                const pct = Math.round((item.value / totalDistribution) * 100);
                return (
                  <div key={item.name} className="fds-radar-legend-item">
                    <span className="flex items-center gap-2">
                      <span className="fds-legend-square" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span>{item.value.toLocaleString()}건 · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-semibold text-[var(--text-faint)]">
          최근 업데이트: {currentKstTime} · 데이터 기준: KST
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

