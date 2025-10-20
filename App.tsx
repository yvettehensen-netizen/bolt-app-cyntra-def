import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthDebugPage } from './pages/AuthDebugPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuickscanPage } from './pages/QuickscanPage';
import { ReportPage } from './pages/ReportPage';
import { ReportsPage } from './pages/ReportsPage';
import { EnvSetupPage } from './pages/EnvSetupPage';
import { HealthDashboardPage } from './pages/HealthDashboardPage';
import { ConsultantsPage } from './pages/ConsultantsPage';
import { ConsultantDetailPage } from './pages/ConsultantDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import { BillingPage } from './pages/BillingPage';
import { BillingReturnPage } from './pages/BillingReturnPage';
import FreeScanPage from './pages/FreeScanPage';
import { AdminGuard, ConsultantGuard } from './components/Guard';

type Page = 'login' | 'signup' | 'auth-debug' | 'dashboard' | 'quickscan' | 'report' | 'reports' | 'env' | 'health' | 'consultants' | 'consultant' | 'admin-users' | 'billing' | 'billing-return' | 'free-scan';

interface RouteState {
  page: Page;
  reportId?: string;
  consultantId?: string;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<RouteState>({ page: 'dashboard' });

  const navigate = (page: Page, id?: string) => {
    if (page === 'report' && id) {
      setRoute({ page, reportId: id });
    } else if (page === 'consultant' && id) {
      setRoute({ page, consultantId: id });
    } else {
      setRoute({ page });
    }
  };

  if (route.page === 'free-scan') {
    return <FreeScanPage />;
  }

  if (route.page === 'signup') {
    return <SignupPage />;
  }

  if (route.page === 'auth-debug' && import.meta.env.DEV) {
    return <AuthDebugPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Bezig met laden...</p>
        </div>
      </div>
    );
  }

  if (!user && route.page !== 'login') {
    return <LoginPage />;
  }

  if (route.page === 'login') {
    return <LoginPage />;
  }

  return (
    <>
      {route.page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      {route.page === 'quickscan' && <QuickscanPage onNavigate={navigate} />}
      {route.page === 'reports' && <ReportsPage onNavigate={navigate} />}
      {route.page === 'report' && route.reportId && (
        <ReportPage onNavigate={navigate} reportId={route.reportId} />
      )}
      {route.page === 'health' && (
        <AdminGuard>
          <HealthDashboardPage onNavigate={navigate} />
        </AdminGuard>
      )}
      {route.page === 'consultants' && (
        <ConsultantGuard>
          <ConsultantsPage onNavigate={navigate} />
        </ConsultantGuard>
      )}
      {route.page === 'consultant' && route.consultantId && (
        <ConsultantGuard>
          <ConsultantDetailPage onNavigate={navigate} consultantId={route.consultantId} />
        </ConsultantGuard>
      )}
      {route.page === 'env' && (
        <AdminGuard>
          <EnvSetupPage onNavigate={navigate} />
        </AdminGuard>
      )}
      {route.page === 'admin-users' && (
        <AdminGuard>
          <AdminUsersPage onNavigate={navigate} />
        </AdminGuard>
      )}
      {route.page === 'billing' && <BillingPage />}
      {route.page === 'billing-return' && <BillingReturnPage />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
