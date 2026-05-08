import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Bell, History, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { BrandLogo } from '../common/BrandLogo';

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', path: '/' },
  { icon: Bell, label: '의심 거래', path: '/alerts' },
  { icon: ShieldCheck, label: '정책 관리', path: '/policy' },
  { icon: History, label: '조치 로그', path: '/audit' },
  { icon: BarChart3, label: '리포트', path: '/reports' },
];

export const Sidebar: React.FC = () => (
  <aside className="fds-sidebar">
    <NavLink to="/" className="fds-sidebar-logo" aria-label="RedFlag dashboard">
      <BrandLogo />
    </NavLink>

    <div className="fds-live">
      <span className="fds-live-dot" />
      SYSTEM LIVE
    </div>

    <nav className="fds-nav" aria-label="Primary navigation">
      <p className="fds-nav-label">Command</p>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => clsx('fds-nav-item', isActive && 'active')}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="fds-sidebar-user">
      <div className="fds-row">
        <div className="fds-logo-mark" style={{ width: 34, height: 34, fontSize: 13, background: '#151b28', color: 'var(--text-mid)' }}>
          AD
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, color: 'var(--text-high)', fontSize: 13, fontWeight: 600 }}>관리자</p>
          <p className="fds-kicker" style={{ margin: '3px 0 0', color: 'var(--text-dim)', fontSize: 9 }}>Fraud analyst</p>
        </div>
      </div>
    </div>
  </aside>
);
