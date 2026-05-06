import React from 'react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, AlertTriangle, RefreshCw, ShieldOff, UserCheck } from 'lucide-react';
import { useFdsStore } from '../store/useFdsStore';
import { RiskBadge, StatusBadge } from '../components/common/Badge';

const StatCard = ({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: any; tone: string }) => (
  <div className="fds-card p-5 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${tone}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { transactions, stats, isLoading, error, fetchDashboard } = useFdsStore();

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const distributionData = [
    { name: '정상', value: stats.normalCount, color: '#10b981' },
    { name: '의심', value: stats.suspiciousCount, color: '#f59e0b' },
    { name: '위험', value: stats.dangerCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">FDS 관리자 대시보드</h2>
          <p className="text-slate-500 text-sm">고객 거래를 실시간 평가하고 자동 조치 및 관리자 대응 상태를 확인합니다.</p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {error && <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="전체 거래" value={stats.totalEvaluated.toLocaleString()} icon={Activity} tone="bg-blue-500/10 text-blue-400" />
        <StatCard title="의심/위험 거래" value={stats.highRiskCount.toLocaleString()} icon={AlertTriangle} tone="bg-amber-500/10 text-amber-400" />
        <StatCard title="차단" value={stats.blockedCount.toLocaleString()} icon={ShieldOff} tone="bg-red-500/10 text-red-400" />
        <StatCard title="추가 인증" value={stats.challengeCount.toLocaleString()} icon={UserCheck} tone="bg-purple-500/10 text-purple-400" />
        <StatCard title="평균 점수" value={stats.avgRiskScore.toFixed(1)} icon={Activity} tone="bg-emerald-500/10 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="fds-card p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-6">위험도 분포</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name} {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="fds-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-semibold text-slate-300">최근 의심 거래</h4>
            <Link to="/alerts" className="text-xs text-blue-400 hover:text-blue-300">전체 보기</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-xs font-medium uppercase tracking-wider">
                  <th className="pb-3 px-2">거래 ID</th>
                  <th className="pb-3 px-2">고객</th>
                  <th className="pb-3 px-2">금액</th>
                  <th className="pb-3 px-2">위험도</th>
                  <th className="pb-3 px-2">상태</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.slice(0, 8).map((alert) => (
                  <tr key={alert.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-2">
                      <Link to={`/alerts/${alert.id}`} className="font-mono text-blue-400 hover:underline">{alert.id.slice(0, 8)}</Link>
                    </td>
                    <td className="py-4 px-2 text-slate-400">{alert.customerId}</td>
                    <td className="py-4 px-2 font-medium text-slate-200">{alert.amount.toLocaleString()}원</td>
                    <td className="py-4 px-2"><RiskBadge level={alert.riskLevel} /></td>
                    <td className="py-4 px-2"><StatusBadge status={alert.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="py-10 text-center text-sm text-slate-500">표시할 의심 거래가 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
