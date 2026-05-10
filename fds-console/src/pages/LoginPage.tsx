import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react';
import { login } from '../services/fdsService';
import { useFdsStore } from '../store/useFdsStore';
import { BrandLogo } from '../components/common/BrandLogo';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useFdsStore();
  const [emailOrUsername, setEmailOrUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(emailOrUsername, password);

      if (data.user.role !== 'ADMIN') {
        localStorage.removeItem('fds_token');
        setError('관리자 계정만 접근 가능합니다.');
        return;
      }

      localStorage.setItem('fds_token', data.token);
      setCurrentUser(data.user);
      navigate('/', { replace: true });
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fds-login">
      <section className="fds-login-hero">
        <div>
          <BrandLogo className="fds-login-logo" />
          <h1 className="mt-10 max-w-2xl text-[42px] font-black leading-tight text-[var(--text-primary)]">
            Red Flag FDS 관리자 콘솔
          </h1>
          <p className="mt-4 max-w-xl text-[15px] font-semibold leading-7 text-[var(--text-muted)]">
            이상금융거래 탐지 결과와 운영자 조치를 실시간으로 모니터링하는 핀테크 운영 대시보드입니다.
          </p>
        </div>

        <div className="grid max-w-2xl grid-cols-3 gap-4">
          <HeroMetric icon={TrendingUp} label="실시간 분석" value="Live" />
          <HeroMetric icon={ShieldCheck} label="위험 대응" value="FDS" />
          <HeroMetric icon={LockKeyhole} label="관리자 전용" value="Admin" />
        </div>
      </section>

      <section className="fds-login-panel">
        <div className="fds-card fds-login-card">
          <div className="mb-7">
            <h2 className="fds-page-title">로그인</h2>
            <p className="fds-page-copy">관리자 계정으로 접속하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="fds-label" htmlFor="emailOrUsername">
                이메일 또는 아이디
              </label>
              <input
                id="emailOrUsername"
                type="text"
                value={emailOrUsername}
                onChange={(event) => setEmailOrUsername(event.target.value)}
                className="fds-input"
                placeholder="admin@fds.local"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="fds-label" htmlFor="password">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="fds-input pr-11"
                  placeholder="비밀번호"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="fds-icon-btn absolute right-2 top-1/2 !h-7 !w-7 -translate-y-1/2 !border-0 !bg-transparent"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="fds-error">{error}</p>}

            <button type="submit" disabled={isLoading} className="fds-btn fds-btn-primary w-full">
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] font-semibold text-[var(--text-faint)]">
            Unauthorized access is prohibited.
          </p>
        </div>
      </section>
    </div>
  );
};

const HeroMetric = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="fds-card fds-card-pad">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-dark)]">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-[12px] font-bold text-[var(--text-muted)]">{label}</p>
    <p className="mt-1 text-[18px] font-black text-[var(--text-primary)]">{value}</p>
  </div>
);

export default LoginPage;
