import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Bell, History, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', path: '/' },
  { icon: Bell, label: '의심 거래', path: '/alerts' },
  { icon: ShieldCheck, label: '정책 관리', path: '/policy' },
  { icon: History, label: '조치 로그', path: '/audit' },
  { icon: BarChart3, label: '리포트', path: '/reports' },
];

export const Sidebar: React.FC = () => (
  <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
    <div className="p-6 border-b border-slate-800 flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">F</div>
      <h1 className="text-xl font-bold text-slate-100">FDS Console</h1>
    </div>

    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            isActive
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="p-4 border-t border-slate-800">
      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-300">AD</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">관리자</p>
          <p className="text-xs text-slate-500 truncate">Fraud analyst</p>
        </div>
        <Settings className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  </aside>
);
