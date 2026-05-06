import React from 'react';
import { Bell, Clock, Search, User } from 'lucide-react';

export const Header: React.FC = () => {
  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="거래 ID 또는 사용자 검색"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm border-r border-slate-800 pr-6">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{now}</span>
        </div>
        <button className="relative p-2 text-slate-400 hover:text-slate-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
        </button>
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
