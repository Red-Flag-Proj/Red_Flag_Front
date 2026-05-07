import React, { useState } from 'react';
import { History, RefreshCw, RotateCcw, Search, ToggleLeft, ToggleRight } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">정책 관리</h2>
          <p className="text-slate-500 text-sm">DB에 저장된 탐지 규칙을 조회하고 활성화 상태를 변경합니다.</p>
        </div>
        <button onClick={fetchRules} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm">
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          새로고침
        </button>
      </div>

      {error && <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ThresholdCard range="0-30" label="정상" desc="자동 승인" color="text-emerald-400" border="border-emerald-500/30" />
        <ThresholdCard range="31-60" label="의심" desc="추가 인증 / 검토" color="text-amber-400" border="border-amber-500/30" />
        <ThresholdCard range="61+" label="위험" desc="거래 보류 또는 차단" color="text-red-400" border="border-red-500/30" />
      </div>

      <div className="fds-card overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  (category === '전체' ? selectedCategories.length === 0 : selectedCategories.includes(category))
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="규칙 검색"
                className="bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              aria-label="필터 초기화"
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/30">
                <th className="py-4 px-6">ID / 코드</th>
                <th className="py-4 px-6">카테고리</th>
                <th className="py-4 px-6">탐지 조건</th>
                <th className="py-4 px-6">점수</th>
                <th className="py-4 px-6">배포 상태</th>
                <th className="py-4 px-6">최근 수정</th>
                <th className="py-4 px-6 text-right">활성화</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="block text-sm font-mono text-blue-400 font-bold">{rule.id}</span>
                    <span className="text-[10px] text-slate-500 mt-1">{rule.code}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-300">{rule.category}</td>
                  <td className="py-4 px-6 text-sm text-slate-300">{rule.condition}</td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-bold text-slate-100">+{rule.score}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{rule.deploymentStatus}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="block text-[11px] text-slate-300">{rule.lastModifiedBy}</span>
                    <span className="text-[10px] text-slate-500">{rule.lastModifiedAt}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => setSelectedRuleId(rule.id)} className={clsx('transition-all p-1 rounded-full', rule.enabled ? 'text-blue-500 hover:text-blue-400' : 'text-slate-600 hover:text-slate-500')}>
                      {rule.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRules.length === 0 && <p className="p-10 text-center text-sm text-slate-500">표시할 정책 규칙이 없습니다.</p>}
        </div>
      </div>

      <div className="fds-card p-6">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          정책 변경은 DB의 policy_rule_logs에 기록됩니다.
        </h3>
      </div>

      {selectedRuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedRuleId(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md shadow-2xl p-8">
            <h4 className="text-xl font-bold text-slate-100 mb-2">정책 변경 확인</h4>
            <p className="text-slate-400 text-sm mb-6">규칙 활성화 상태를 변경하는 이유를 입력하세요.</p>
            <textarea className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500" value={reason} onChange={(event) => setReason(event.target.value)} />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setSelectedRuleId(null)} className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg font-semibold">취소</button>
              <button onClick={confirmToggle} disabled={!reason.trim() || isLoading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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

const ThresholdCard = ({ range, label, desc, color, border }: { range: string; label: string; desc: string; color: string; border: string }) => (
  <div className={clsx('fds-card p-4 flex flex-col items-center text-center gap-2', border)}>
    <span className={clsx('text-lg font-black', color)}>{range}</span>
    <p className="text-xs font-bold text-slate-200">{label}</p>
    <p className="text-[10px] text-slate-500 uppercase">{desc}</p>
  </div>
);

export default PolicyManagementPage;
