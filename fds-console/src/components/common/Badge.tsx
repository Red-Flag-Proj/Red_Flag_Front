import React from 'react';
import { clsx } from 'clsx';
import type { RiskLevel, TransactionStatus } from '../../types/fds';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className }) => (
  <span className={clsx('fds-badge', className)}>
    {children}
  </span>
);

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const styles: Record<RiskLevel, string> = {
    NORMAL: 'fds-badge-normal',
    SUSPICIOUS: 'fds-badge-suspicious',
    DANGER: 'fds-badge-danger',
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
    APPROVED: 'fds-badge-normal',
    PENDING_REVIEW: 'fds-badge-blue',
    REQUIRES_AUTH: 'fds-badge-blue',
    CALL_REQUIRED: 'fds-badge-suspicious',
    CALL_IN_PROGRESS: 'fds-badge-blue fds-badge-pulse',
    CALL_CONFIRMED: 'fds-badge-normal',
    BLOCKED: 'fds-badge-danger',
    CARD_SUSPENDED: 'fds-badge-danger',
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
