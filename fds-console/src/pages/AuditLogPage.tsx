import React, { useState } from 'react';
import { Activity, Download, FileText, Search, User } from 'lucide-react';
import { useFdsStore } from '../store/useFdsStore';

const AuditLogPage: React.FC = () => {
  const { auditLogs, fetchDashboard } = useFdsStore();
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredLogs = auditLogs.filter((log) => {
    const query = searchTerm.toLowerCase();
    return log.actor.toLowerCase().includes(query) || log.targetId.toLowerCase().includes(query) || log.description.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">조치 로그</h2>
          <p className="text-slate-500 text-sm">자동 조치와 관리자 승인/보류/차단 이력을 추적합니다.</p>
        </div>
        <button onClick={() => fetchDashboard()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm">
          <Download className="w-4 h-4" />
          새로고침
        </button>
      </div>

      <div className="fds-card p-4 bg-slate-900/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="actor, 거래 ID, 설명 검색" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 text-slate-200" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
      </div>

      <div className="fds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900/30">
                <th className="py-4 px-6">유형</th>
                <th className="py-4 px-6">시간</th>
                <th className="py-4 px-6">행위자</th>
                <th className="py-4 px-6">거래 ID</th>
                <th className="py-4 px-6">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-500">
                      <FileText className="w-12 h-12 opacity-10" />
                      <p>표시할 조치 로그가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase text-slate-400">{log.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-400">{log.timestamp}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-300">{log.actor}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-blue-400">{log.targetId.slice(0, 8)}</td>
                  <td className="py-4 px-6 text-xs text-slate-300">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
