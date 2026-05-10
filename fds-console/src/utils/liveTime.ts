import React from 'react';

export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timerId);
  }, [intervalMs]);

  return now;
}

export function formatElapsed(value: string | undefined, now = Date.now()): string {
  if (!value) return '-';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '-';

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return `${elapsedSeconds}초 전`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}시간 전`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}일 전`;
}
