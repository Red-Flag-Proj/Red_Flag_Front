import { createBrowserRouter } from 'react-router-dom';
import { Layout, ProtectedRoute } from './AppShell';
import DashboardPage from '../pages/DashboardPage';
import AlertQueuePage from '../pages/AlertQueuePage';
import TransactionDetailPage from '../pages/TransactionDetailPage';
import PolicyManagementPage from '../pages/PolicyManagementPage';
import AuditLogPage from '../pages/AuditLogPage';
import ReportsPage from '../pages/ReportsPage';
import LoginPage from '../pages/LoginPage';

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
