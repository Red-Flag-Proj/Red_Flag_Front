import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, LogOut, Search, User } from 'lucide-react';
import { logout } from '../../services/fdsService';
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
  const { stats, transactions, fetchDashboard, currentUser, clearAuth } = useFdsStore();

  const handleLogout = () => {
    logout();
    clearAuth();
    navigate('/login', { replace: true });
  };
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
      tone: 'fds-badge-blue',
    },
    {
      label: '위험 거래',
      description: '위험 등급으로 분류된 거래',
      count: dangerCount,
      path: '/alerts?risk=DANGER',
      tone: 'fds-badge-danger',
    },
    {
      label: 'ARS 확인 대기',
      description: '고객 본인 확인이 필요한 거래',
      count: arsPendingCount,
      path: '/alerts?status=CALL_REQUIRED',
      tone: 'fds-badge-suspicious',
    },
  ];

  const handleNotificationClick = (path: string) => {
    navigate(path);
    setIsNotificationsOpen(false);
  };

  return (
    <header className="fds-header">
      <div className="fds-header-search">
        <form className="fds-search" onSubmit={handleSearchSubmit}>
          <Search className="fds-search-icon" />
          <input
            type="text"
            placeholder="거래 ID 또는 사용자 검색"
            className="fds-input has-icon"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>

      <div className="fds-header-actions">
        <div className="fds-row fds-clock fds-header-clock">
          <Clock className="w-4 h-4" />
          <span>{now}</span>
        </div>
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="fds-icon-btn"
            aria-label="알림"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((value) => !value)}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="fds-notification-count">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="fds-notification-popover">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)' }}>
                <p className="fds-notification-title">알림 센터</p>
                <p className="fds-page-copy" style={{ marginTop: 4 }}>확인이 필요한 거래를 빠르게 필터링합니다.</p>
              </div>
              <div style={{ padding: 8 }}>
                {notificationItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNotificationClick(item.path)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p style={{ margin: 0, color: 'var(--text-high)', fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                      <p className="truncate" style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: 11 }}>{item.description}</p>
                    </div>
                    <span className={`fds-badge ${item.tone}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleNotificationClick('/alerts')}
                className="w-full px-4 py-3 border-t border-white/[0.04] text-left text-[12px] font-semibold text-[var(--red-vivid)] hover:bg-white/[0.03]"
              >
                전체 의심 거래 보기
              </button>
            </div>
          )}
        </div>
        <div className="fds-row">
          <div className="fds-user-chip">
            <div className="fds-user-copy">
              <p className="fds-user-name">
                {currentUser?.username ?? currentUser?.email ?? 'Admin'}
              </p>
              <p className="fds-user-role">
                {currentUser?.role ?? 'Analyst'}
              </p>
            </div>
            <div className="fds-user-avatar" aria-hidden="true">
              <User className="w-4 h-4" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="fds-icon-btn"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
