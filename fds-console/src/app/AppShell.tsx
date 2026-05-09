import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export function ProtectedRoute() {
  const token = localStorage.getItem('fds_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function Layout() {
  return (
    <div className="fds-shell">
      <Sidebar />
      <div className="fds-content">
        <Header />
        <main className="fds-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
