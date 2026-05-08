import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import DashboardPage from '../pages/DashboardPage';
import AlertQueuePage from '../pages/AlertQueuePage';
import TransactionDetailPage from '../pages/TransactionDetailPage';
import PolicyManagementPage from '../pages/PolicyManagementPage';
import AuditLogPage from '../pages/AuditLogPage';
import ReportsPage from '../pages/ReportsPage';
import LoginPage from '../pages/LoginPage';

function ProtectedRoute() {
  const token = localStorage.getItem('fds_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const Layout = () => (
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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'alerts', element: <AlertQueuePage /> },
          { path: 'alerts/:id', element: <TransactionDetailPage /> },
          { path: 'policy', element: <PolicyManagementPage /> },
          { path: 'audit', element: <AuditLogPage /> },
          { path: 'reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
]);
