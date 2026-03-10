import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoadingScreen } from './components/common/LoadingScreen';
import toast from 'react-hot-toast';

// Lazy load pages for code splitting
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const KPIsPage = React.lazy(() => import('./pages/KPIsPage'));
const KPIDetailPage = React.lazy(() => import('./pages/KPIDetailPage'));
const AlertsPage = React.lazy(() => import('./pages/AlertsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Layout components
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const App: React.FC = () => {
    const { isLoading, logout } = useAuth();
    const navigate = useNavigate();

    // FIX: Listen for unauthorized events to handle redirects smoothly
    useEffect(() => {
        const handleUnauthorized = async () => {
            toast.error('Your session has expired. Please log in again.');
            await logout(); // Clear internal auth state
            navigate('/login', { replace: true });
        };

        window.addEventListener('api:unauthorized', handleUnauthorized);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('api:unauthorized', handleUnauthorized);
        };
    }, [logout, navigate]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="kpis" element={<KPIsPage />} />
                    <Route path="kpis/:kpiId" element={<KPIDetailPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
};

export default App;
