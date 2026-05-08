import React, { useState } from 'react';
import { History, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useFdsStore } from '../store/useFdsStore';

const categories = ['전체', '금액', '빈도', '위치', '시간', '행동', '계정 보안'];

const PolicyManagementPage: React.FC = () => {
  const { rules, error, isLoading, fetchRules, toggleRule } = useFdsStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filteredRules = rules.filter((rule) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(rule.category);
    const matchesSearch = !query || [
      rule.id,
      rule.code,
      rule.category,
      rule.condition,
      rule.deploymentStatus,
      rule.lastModifiedBy,
    ].some((value) => String(value ?? '').toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const toggleCategory = (category: string) => {
    if (category === '전체') {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchTerm('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || searchTerm.trim().length > 0;

  const confirmToggle = async () => {
    if (!selectedRuleId || !reason.trim()) return;
    await toggleRule(selectedRuleId, reason);
    setSelectedRuleId(null);
    setReason('');
  };

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          {/* <p className="fds-kicker">// 정책 관리</p> */}
          <h2 className="fds-page-title">정책 관리</h2>
          <p className="fds-page-copy">DB에 저장된 탐지 규칙을 조회하고 활성화 상태를 변경합니다.</p>
        </div>
        <button onClick={fetchRules} className="fds-btn fds-btn-ghost">
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          새로고침
        </button>
      </div>

      {error && <div className="fds-error">{error}</div>}

      <div className="fds-grid-3">
        <ThresholdCard range="0-30" label="정상" desc="자동 승인" accent="#00e676" />
        <ThresholdCard range="31-60" label="의심" desc="추가 인증 / 검토" accent="#f5a623" />
        <ThresholdCard range="61+" label="위험" desc="거래 보류 또는 차단" accent="#ff2c3d" />
      </div>

      <div className="fds-card overflow-hidden">
        <div className="fds-row-between" style={{ padding: 16, borderBottom: '1px solid var(--border-dim)' }}>
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={clsx(
                  'fds-category-btn',
                  (category === '전체' ? selectedCategories.length === 0 : selectedCategories.includes(category))
                    ? 'active'
                    : ''
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="fds-row">
            <div className="fds-search" style={{ minWidth: 210 }}>
              <Search className="fds-search-icon" />
              <input
                type="text"
                placeholder="규칙 검색"
                className="fds-input has-icon"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              aria-label="필터 초기화"
              className="fds-icon-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="fds-table-wrap">
          <table className="fds-table">
            <thead>
              <tr>
                <th>ID / 코드</th>
                <th>카테고리</th>
                <th>탐지 조건</th>
                <th>점수</th>
                <th>배포 상태</th>
                <th>최근 수정</th>
                <th className="text-right">활성화</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="block fds-code">{rule.id.toUpperCase()}</span>
                    <span className="text-[10px] fds-dim mt-1">{String(rule.code ?? '-').toUpperCase()}</span>
                  </td>
                  <td>{rule.category}</td>
                  <td>{rule.condition}</td>
                  <td>
                    <span style={{ color: 'var(--text-high)', fontWeight: 700 }}>+{rule.score}</span>
                  </td>
                  <td>
                    <span className="fds-badge fds-badge-normal">{rule.deploymentStatus}</span>
                  </td>
                  <td>
                    <span className="block text-[11px]">{rule.lastModifiedBy.toUpperCase()}</span>
                    <span className="text-[10px] fds-dim">{rule.lastModifiedAt}</span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => setSelectedRuleId(rule.id)} className="inline-flex" aria-label="정책 활성화 상태 변경">
                      <ToggleSwitch enabled={rule.enabled} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRules.length === 0 && <p className="fds-empty">// 표시할 데이터가 없습니다</p>}
        </div>
      </div>

      <div className="fds-card fds-card-pad">
        <h3 className="fds-panel-title flex items-center gap-2">
          <History className="w-4 h-4 fds-dim" />
          정책 변경은 DB의 policy_rule_logs에 기록됩니다.
        </h3>
      </div>

      {selectedRuleId && (
        <div className="fds-modal">
          <div className="fds-modal-backdrop" onClick={() => setSelectedRuleId(null)} />
          <div className="fds-modal-panel">
            <h4 className="fds-panel-title">정책 변경 확인</h4>
            <p className="fds-panel-subtitle" style={{ marginBottom: 18 }}>규칙 활성화 상태를 변경하는 이유를 입력하세요.</p>
            <textarea className="fds-textarea" value={reason} onChange={(event) => setReason(event.target.value)} />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setSelectedRuleId(null)} className="fds-btn fds-btn-ghost flex-1">취소</button>
              <button onClick={confirmToggle} disabled={!reason.trim() || isLoading} className="fds-btn fds-btn-primary flex-1">
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

const ThresholdCard = ({ range, label, desc, accent }: { range: string; label: string; desc: string; accent: string }) => (
  <div className="fds-card fds-threshold" style={{ '--accent': accent } as React.CSSProperties}>
    <span className="fds-threshold-value">{range}</span>
    <p style={{ margin: '10px 0 0', color: 'var(--text-high)', fontWeight: 700 }}>{label}</p>
    <p className="fds-page-copy" style={{ marginTop: 6 }}>{desc}</p>
  </div>
);

const ToggleSwitch = ({ enabled }: { enabled: boolean }) => (
  <svg width="46" height="24" viewBox="0 0 46 24" aria-hidden="true">
    <rect
      x="1"
      y="1"
      width="44"
      height="22"
      rx="2"
      fill={enabled ? 'rgba(255,44,61,0.12)' : 'rgba(122,138,170,0.08)'}
      stroke={enabled ? 'rgba(255,44,61,0.36)' : 'rgba(122,138,170,0.22)'}
    />
    <circle
      cx={enabled ? 34 : 12}
      cy="12"
      r="7"
      fill={enabled ? '#ff2c3d' : '#3a4560'}
      style={{ transition: 'cx 180ms ease, fill 180ms ease' }}
    />
  </svg>
);

export default PolicyManagementPage;
