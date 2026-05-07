import React from 'react';
import { clsx } from 'clsx';
import type { RiskLevel, TransactionStatus } from '../../types/fds';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className }) => (
  <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap', className)}>
    {children}
  </span>
);

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const styles: Record<RiskLevel, string> = {
    NORMAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SUSPICIOUS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DANGER: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const labels: Record<RiskLevel, string> = {
    NORMAL: '정상',
    SUSPICIOUS: '의심',
    DANGER: '위험',
  };

  return <Badge className={styles[level]}>{labels[level]}</Badge>;
};

export const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const styles: Record<TransactionStatus, string> = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING_REVIEW: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    REQUIRES_AUTH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CALL_REQUIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CALL_IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CALL_CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
    CARD_SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const labels: Record<TransactionStatus, string> = {
    APPROVED: '승인',
    PENDING_REVIEW: '보류',
    REQUIRES_AUTH: '추가 인증',
    CALL_REQUIRED: 'ARS 확인 대기',
    CALL_IN_PROGRESS: 'ARS 진행 중',
    CALL_CONFIRMED: 'ARS 본인 확인',
    BLOCKED: '차단',
    CARD_SUSPENDED: '카드 정지',
  };

  return <Badge className={styles[status]}>{labels[status]}</Badge>;
};
