import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
      <div className="fds-card fds-login-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <BrandLogo className="fds-login-logo" stacked />
          <p className="fds-page-copy">SECURITY OPERATIONS CONSOLE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="fds-label">
              이메일 또는 아이디
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="fds-input"
              placeholder="admin@fds.local"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="fds-label">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fds-input pr-11"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 fds-icon-btn"
                style={{ width: 28, height: 28, border: 0, background: 'transparent' }}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="fds-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="fds-btn fds-btn-primary w-full mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                로그인 중...
              </>
            ) : (
              '로그인 →'
            )}
          </button>
        </form>
        <p className="fds-page-copy" style={{ marginTop: 22, textAlign: 'center', color: 'var(--text-dim)' }}>
          UNAUTHORIZED ACCESS IS PROHIBITED
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
