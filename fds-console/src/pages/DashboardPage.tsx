import React from 'react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts';
import { Activity, AlertTriangle, RefreshCw, ShieldOff, UserCheck, type LucideIcon } from 'lucide-react';
import { useFdsStore } from '../store/useFdsStore';
import { RiskBadge, StatusBadge } from '../components/common/Badge';

type RiskDistributionItem = {
  name: string;
  value: number;
  color: string;
};

const StatCard = ({ title, value, icon: Icon, accent }: { title: string; value: string | number; icon: LucideIcon; accent: string }) => (
  <div className="fds-card fds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
    <div>
      <p className="fds-stat-label">{title}</p>
      <h3 className="fds-stat-value">{value}</h3>
    </div>
    <div className="fds-stat-icon absolute right-4 top-4">
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const RiskChartTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as RiskDistributionItem | undefined;

  if (!item) {
    return null;
  }

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

const DashboardPage: React.FC = () => {
  const { transactions, stats, isLoading, error, fetchDashboard } = useFdsStore();

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const distributionData: RiskDistributionItem[] = [
    { name: '정상', value: stats.normalCount, color: '#00e676' },
    { name: '의심', value: stats.suspiciousCount, color: '#f5a623' },
    { name: '위험', value: stats.dangerCount, color: '#ff2c3d' },
  ].filter((item) => item.value > 0);

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          {/* <p className="fds-kicker">// 관리자 대시보드</p> */}
          <h2 className="fds-page-title">FDS 관리자 대시보드</h2>
          <p className="fds-page-copy">고객 거래를 실시간 평가하고 자동 조치 및 관리자 대응 상태를 확인합니다.</p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          className="fds-btn fds-btn-ghost"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {error && <div className="fds-error">{error}</div>}

      <div className="fds-grid-5">
        <StatCard title="전체 거래" value={stats.totalEvaluated.toLocaleString()} icon={Activity} accent="#3b7fff" />
        <StatCard title="의심/위험 거래" value={stats.highRiskCount.toLocaleString()} icon={AlertTriangle} accent="#f5a623" />
        <StatCard title="차단" value={stats.blockedCount.toLocaleString()} icon={ShieldOff} accent="#ff2c3d" />
        <StatCard title="추가 인증" value={stats.challengeCount.toLocaleString()} icon={UserCheck} accent="#7fabff" />
        <StatCard title="평균 점수" value={stats.avgRiskScore.toFixed(1)} icon={Activity} accent="#00e676" />
      </div>

      <div className="fds-grid-2-1">
        <div className="fds-card fds-card-pad">
          <h4 className="fds-panel-title" style={{ marginBottom: 20 }}>위험도 분포</h4>
          <div className="h-[280px] fds-risk-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={distributionData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" tabIndex={-1} focusable="false" />
                  ))}
                </Pie>
                <Tooltip cursor={false} content={<RiskChartTooltip active={false} payload={[]} coordinate={undefined} accessibilityLayer={false} activeIndex={undefined} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs fds-muted">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="fds-legend-square" style={{ backgroundColor: item.color }} />
                {item.name} {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="fds-card fds-card-pad">
          <div className="fds-row-between" style={{ marginBottom: 16 }}>
            <h4 className="fds-panel-title">최근 의심 거래</h4>
            <Link to="/alerts" className="fds-code">전체 보기</Link>
          </div>
          <div className="fds-table-wrap">
            <table className="fds-table">
              <thead>
                <tr>
                  <th>거래 ID</th>
                  <th>고객</th>
                  <th>금액</th>
                  <th>위험도</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <Link to={`/alerts/${alert.id}`} className="fds-code">{alert.id.slice(0, 8).toUpperCase()}</Link>
                    </td>
                    <td className="fds-muted">{alert.customerId.toUpperCase()}</td>
                    <td style={{ color: 'var(--text-high)', fontWeight: 600 }}>{alert.amount.toLocaleString()}원</td>
                    <td><RiskBadge level={alert.riskLevel} /></td>
                    <td><StatusBadge status={alert.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
