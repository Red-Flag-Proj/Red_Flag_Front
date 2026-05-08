import React from 'react';
import { clsx } from 'clsx';

type BrandLogoProps = {
  className?: string;
  stacked?: boolean;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ className, stacked = false }) => {
  const id = React.useId().replace(/:/g, '');
  const steelId = `redflag-steel-${id}`;
  const hotId = `redflag-hot-${id}`;
  const beamId = `redflag-beam-${id}`;
  const glowId = `redflag-glow-${id}`;

  return (
    <span className={clsx('fds-brand-logo', stacked && 'stacked', className)}>
      <span className="fds-brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <defs>
            <linearGradient id={steelId} x1="11" y1="8" x2="53" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#303b50" />
              <stop offset="0.55" stopColor="#111722" />
              <stop offset="1" stopColor="#050608" />
            </linearGradient>
            <linearGradient id={hotId} x1="17" y1="13" x2="47" y2="53" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ff8b92" />
              <stop offset="0.38" stopColor="#ff2c3d" />
              <stop offset="1" stopColor="#920a15" />
            </linearGradient>
            <linearGradient id={beamId} x1="15" y1="36" x2="51" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3b7fff" stopOpacity="0.05" />
              <stop offset="0.5" stopColor="#7fabff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#3b7fff" stopOpacity="0.05" />
            </linearGradient>
            <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1 0 0 0 0 0.12 0 0 0 0 0.18 0 0 0 0.7 0" />
              <feBlend in="SourceGraphic" />
            </filter>
          </defs>
          <path
            d="M32 5.5 52 13.8v15.7c0 13.1-7.7 22.3-20 27.8-12.3-5.5-20-14.7-20-27.8V13.8L32 5.5Z"
            fill={`url(#${steelId})`}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.4"
          />
          <path
            d="M21.2 17.2h24.1l-4.5 8.1H26.4v6.3h15.4l-4.5 8.1H26.4v9.4h-5.2V17.2Z"
            fill={`url(#${hotId})`}
            filter={`url(#${glowId})`}
          />
          <path
            d="M41 16.9 51 23.8 39 27.2l4.2-7.4c.9-1.6-.4-3.4-2.2-2.9Z"
            fill="#f0f4ff"
            opacity="0.92"
          />
          <path
            d="M16.8 34.8c4.3 4.4 9.4 6.6 15.2 6.6s10.9-2.2 15.2-6.6"
            fill="none"
            stroke={`url(#${beamId})`}
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M20.7 29.8c3.2 2.5 7 3.8 11.3 3.8s8.1-1.3 11.3-3.8"
            fill="none"
            stroke="#7fabff"
            strokeLinecap="round"
            strokeWidth="1.4"
            opacity="0.42"
          />
          <circle cx="32" cy="34.8" r="3.2" fill="#f0f4ff" />
          <circle cx="32" cy="34.8" r="7.2" fill="none" stroke="#ff2c3d" strokeWidth="1.2" opacity="0.34" />
        </svg>
      </span>
      <span className="fds-brand-wordmark">
        <span className="fds-brand-name">
          <span className="fds-brand-name-red">RED</span>
          <span className="fds-brand-name-flag">FLAG</span>
        </span>
        <span className="fds-brand-sub">FDS CONTROL</span>
      </span>
    </span>
  );
};
