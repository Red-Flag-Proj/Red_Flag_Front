import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import DashboardPage from '../pages/DashboardPage';
import AlertQueuePage from '../pages/AlertQueuePage';
import TransactionDetailPage from '../pages/TransactionDetailPage';
import PolicyManagementPage from '../pages/PolicyManagementPage';
import AuditLogPage from '../pages/AuditLogPage';
import ReportsPage from '../pages/ReportsPage';

const Layout = () => (
  <div className="flex min-h-screen bg-[#0f172a]">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  </div>
);

export const router = createBrowserRouter([
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
    ]
  }
]);
