import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Clock, LogOut, Search } from 'lucide-react';
import { logout } from '../../services/fdsService';
import { useFdsStore } from '../../store/useFdsStore';
import { BrandLogo } from '../common/BrandLogo';

const navItems = [
  { label: '대시보드', path: '/' },
  { label: '의심 거래', path: '/alerts' },
  { label: '규칙 관리', path: '/policy' },
  { label: '조치 로그', path: '/audit' },
  { label: '리포트', path: '/reports' },
  { label: '설정', path: '/policy' },
];

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [now, setNow] = React.useState(formatNow);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(formatNow());
    }, 1000);

    return () => window.clearInterval(timerId);
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
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isNotificationsOpen]);

  const handleLogout = () => {
    logout();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/alerts?search=${encodeURIComponent(query)}`);
  };

  const pendingReviewCount = transactions.length
    ? transactions.filter((item) => item.status === 'PENDING_REVIEW').length
    : stats.pendingReviewCount;
  const dangerCount = transactions.length
    ? transactions.filter((item) => item.riskLevel === 'DANGER').length
    : stats.dangerCount;
  const arsPendingCount = transactions.length
    ? transactions.filter((item) => item.status === 'CALL_REQUIRED' || item.status === 'CALL_IN_PROGRESS').length
    : stats.arsPendingCount;
  const notificationCount = pendingReviewCount + dangerCount + arsPendingCount;

  const notificationItems = [
    { label: '검토 대기', description: '운영자 확인이 필요한 거래', count: pendingReviewCount, path: '/alerts?status=PENDING_REVIEW', tone: 'fds-badge-blue' },
    { label: '위험 거래', description: '위험 등급으로 분류된 거래', count: dangerCount, path: '/alerts?risk=DANGER', tone: 'fds-badge-danger' },
    { label: 'ARS 확인', description: '고객 본인 확인 진행 거래', count: arsPendingCount, path: '/alerts?status=CALL_REQUIRED', tone: 'fds-badge-suspicious' },
  ];

  const handleNotificationClick = (path: string) => {
    navigate(path);
    setIsNotificationsOpen(false);
  };

  return (
    <header className="fds-header">
      <div className="fds-header-brand">
        <NavLink to="/" aria-label="Red Flag 대시보드">
          <BrandLogo />
        </NavLink>
      </div>

      <nav className="fds-top-nav" aria-label="상단 메뉴">
        {navItems.map((item) => (
          <NavLink
            key={`${item.label}-${item.path}`}
            to={item.path}
            className={({ isActive }) => `fds-top-nav-link ${isActive && item.label !== '설정' ? 'active' : ''}`.trim()}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="fds-header-actions">
        <form className="fds-search fds-header-search" onSubmit={handleSearchSubmit}>
          <Search className="fds-search-icon" />
          <input
            type="text"
            placeholder="검색 (거래, 고객, 기기, IP)"
            className="fds-input has-icon"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>

        <div className="fds-header-clock" aria-label="현재 시간">
          <Clock className="h-3.5 w-3.5" />
          <span>{now}</span>
          <span className="text-white/60">KST</span>
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="fds-icon-btn"
            aria-label="알림"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((value) => !value)}
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="fds-notification-count">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="fds-notification-popover">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="fds-notification-title">알림 센터</p>
                <p className="fds-page-copy">검토가 필요한 거래 큐로 바로 이동합니다.</p>
              </div>
              <div className="p-2">
                {notificationItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNotificationClick(item.path)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--surface-soft)]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[var(--text-primary)]">{item.label}</span>
                      <span className="mt-1 block truncate text-[11px] text-[var(--text-muted)]">{item.description}</span>
                    </span>
                    <span className={`fds-badge ${item.tone}`}>{item.count}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleNotificationClick('/alerts')}
                className="w-full border-t border-[var(--border)] px-4 py-3 text-left text-[12px] font-bold text-[var(--primary-dark)] hover:bg-[var(--primary-soft)]"
              >
                전체 알림 큐 보기
              </button>
            </div>
          )}
        </div>

        <div className="fds-user-chip">
          <div className="fds-user-avatar" aria-hidden="true">A</div>
          <div className="fds-user-copy">
            <p className="fds-user-name">{currentUser?.username ?? '관리자'}</p>
            <p className="fds-user-role">{currentUser?.role?.toLowerCase() ?? 'admin'}</p>
          </div>
          <ChevronDown className="h-3 w-3 text-white/80" />
        </div>

        <button type="button" onClick={handleLogout} className="fds-icon-btn" aria-label="로그아웃" title="로그아웃">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
