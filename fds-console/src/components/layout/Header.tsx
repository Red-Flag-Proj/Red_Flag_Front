import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, Search, User } from 'lucide-react';
import { useFdsStore } from '../../store/useFdsStore';

const formatNow = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { stats, transactions, fetchDashboard } = useFdsStore();
  const [now, setNow] = React.useState(formatNow);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(formatNow());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  React.useEffect(() => {
    if (stats.totalEvaluated === 0 && transactions.length === 0) {
      void fetchDashboard();
    }
  }, [fetchDashboard, stats.totalEvaluated, transactions.length]);

  React.useEffect(() => {
    if (!isNotificationsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isNotificationsOpen]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    navigate(`/alerts?search=${encodeURIComponent(query)}`);
  };

  const hasTransactionRows = transactions.length > 0;
  const pendingReviewCount = hasTransactionRows
    ? transactions.filter((item) => item.status === 'PENDING_REVIEW').length
    : stats.pendingReviewCount;
  const dangerCount = hasTransactionRows
    ? transactions.filter((item) => item.riskLevel === 'DANGER').length
    : stats.dangerCount;
  const arsPendingCount = hasTransactionRows
    ? transactions.filter((item) => item.status === 'CALL_REQUIRED').length
    : stats.arsPendingCount;
  const notificationCount = hasTransactionRows
    ? transactions.filter((item) => item.status === 'PENDING_REVIEW' || item.status === 'CALL_REQUIRED' || item.riskLevel === 'DANGER').length
    : pendingReviewCount + dangerCount + arsPendingCount;

  const notificationItems = [
    {
      label: '검토 대기',
      description: '관리자 확인이 필요한 거래',
      count: pendingReviewCount,
      path: '/alerts?status=PENDING_REVIEW',
      tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: '위험 거래',
      description: '위험 등급으로 분류된 거래',
      count: dangerCount,
      path: '/alerts?risk=DANGER',
      tone: 'text-red-300 bg-red-500/10 border-red-500/20',
    },
    {
      label: 'ARS 확인 대기',
      description: '고객 본인 확인이 필요한 거래',
      count: arsPendingCount,
      path: '/alerts?status=CALL_REQUIRED',
      tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const handleNotificationClick = (path: string) => {
    navigate(path);
    setIsNotificationsOpen(false);
  };

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <form className="relative w-full" onSubmit={handleSearchSubmit}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="거래 ID 또는 사용자 검색"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-500"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm border-r border-slate-800 pr-6">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{now}</span>
        </div>
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="relative p-2 text-slate-400 hover:text-slate-200"
            aria-label="알림"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((value) => !value)}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-900 flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-bold text-slate-100">알림</p>
                <p className="text-xs text-slate-500 mt-0.5">확인이 필요한 거래를 빠르게 필터링합니다.</p>
              </div>
              <div className="p-2">
                {notificationItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNotificationClick(item.path)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                    </div>
                    <span className={`min-w-9 h-7 px-2 rounded-full border text-xs font-bold flex items-center justify-center ${item.tone}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleNotificationClick('/alerts')}
                className="w-full px-4 py-3 border-t border-slate-800 text-sm font-semibold text-blue-400 hover:bg-slate-800/70 text-left"
              >
                전체 의심 거래 보기
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-200">Admin</p>
            <p className="text-[10px] text-slate-500 uppercase">Analyst</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  );
};
