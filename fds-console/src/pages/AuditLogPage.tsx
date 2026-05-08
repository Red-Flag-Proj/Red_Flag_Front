import React, { useState } from 'react';
import { Activity, FileText, RefreshCw, Search, User } from 'lucide-react';
import { useFdsStore } from '../store/useFdsStore';

const AuditLogPage: React.FC = () => {
  const { auditLogs, fetchDashboard, isLoading } = useFdsStore();
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredLogs = auditLogs.filter((log) => {
    const query = searchTerm.toLowerCase();
    return log.actor.toLowerCase().includes(query) || log.targetId.toLowerCase().includes(query) || log.description.toLowerCase().includes(query);
  });

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          {/* <p className="fds-kicker">// 조치 로그</p> */}
          <h2 className="fds-page-title">조치 로그</h2>
          <p className="fds-page-copy">자동 조치와 관리자 승인/보류/차단 이력을 추적합니다.</p>
        </div>
        <button onClick={() => fetchDashboard()} className="fds-btn fds-btn-ghost">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      <div className="fds-card fds-card-pad">
        <div className="fds-search">
          <Search className="fds-search-icon" />
          <input type="text" placeholder="actor, 거래 ID, 설명 검색" className="fds-input has-icon" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
      </div>

      <div className="fds-card overflow-hidden">
        <div className="fds-table-wrap">
          <table className="fds-table">
            <thead>
              <tr>
                <th>유형</th>
                <th>시간</th>
                <th>행위자</th>
                <th>거래 ID</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="fds-empty">
                      <FileText className="w-10 h-10 opacity-10 mx-auto mb-4" />
                      <p>// 표시할 데이터가 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[var(--red-vivid)]" />
                      <span className="fds-badge fds-badge-dim">{log.type}</span>
                    </div>
                  </td>
                  <td className="fds-muted text-xs">{log.timestamp}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 fds-dim" />
                      <span>{log.actor.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="fds-code">{log.targetId.slice(0, 8).toUpperCase()}</td>
                  <td>{log.description}</td>
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
