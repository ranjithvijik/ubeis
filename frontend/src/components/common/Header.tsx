import React from 'react';
import { Menu, Bell, Search, Sun, Moon, User, LogOut, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useAlerts } from '../../hooks/useAlerts';
import ubaltLogo from '../../assets/ubalt-logo.svg';
import type { Alert } from '../../types';

interface HeaderProps {
    onMenuClick: () => void;
}

const severityStyles: Record<Alert['severity'], string> = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    warning: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    info: 'border-sky-500 bg-sky-50 dark:bg-sky-900/20',
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { data: alertsData, isLoading: alertsLoading } = useAlerts({ status: 'active' });
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [showAlertsPanel, setShowAlertsPanel] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const navigate = useNavigate();

    const alerts = alertsData?.items ?? [];
    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const displayAlerts = alerts.slice(0, 8);

    return (
        <header className= "sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" >
        <div className="flex items-center justify-between h-16 px-4" >
            {/* Left side */ }
            < div className = "flex items-center gap-4" >
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

            {/* Brand */ }
            <div className="hidden sm:flex items-center gap-3">
                <a href="https://www.ubalt.edu/" target="_blank" rel="noreferrer" className="flex items-center gap-3">
                    <img
                        src={ubaltLogo}
                        alt="University of Baltimore"
                        className="h-8 w-auto"
                    />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Executive Information System
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[520px]">
                            The University of Baltimore offers career-focused education for aspiring and current professionals.
                        </div>
                    </div>
                </a>
            </div>

            {/* Search */ }
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const q = searchTerm.trim();
                            if (q) {
                                navigate(`/kpis?search=${encodeURIComponent(q)}`);
                            }
                        }
                    }}
                    placeholder="Search KPIs, alerts..."
                    className="bg-transparent border-none outline-none text-sm w-64 text-gray-700 dark:text-gray-200 placeholder-gray-500"
                />
            </div>
        </div>

    {/* Right side */ }
    <div className="flex items-center gap-3" >
                {/* Theme toggle */}
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
        >
        { theme === 'dark' ? (
            <Sun className= "w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
    <Moon className= "w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
</button>

        {/* Alerts / Notifications */}
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setShowUserMenu(false);
                    setShowAlertsPanel((prev) => !prev);
                }}
                aria-label="View alerts"
                aria-expanded={showAlertsPanel}
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {criticalCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {criticalCount}
                    </span>
                )}
            </button>

            {showAlertsPanel && (
                <>
                    <div
                        role="presentation"
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAlertsPanel(false)}
                        aria-hidden
                    />
                    <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] max-h-[min(400px,70vh)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alerts</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {alerts.length} active
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 overscroll-contain">
                            {alertsLoading ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Loading alerts…
                                </div>
                            ) : displayAlerts.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No active alerts
                                </div>
                            ) : (
                                <ul className="py-1">
                                    {displayAlerts.map((alert) => (
                                        <li key={alert.alertId}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAlertsPanel(false);
                                                    navigate(`/alerts`);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 border-l-2 ${severityStyles[alert.severity]} hover:opacity-90 transition`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                            {alert.kpiName}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                                                            {alert.message}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(alert.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAlertsPanel(false);
                                    navigate('/alerts');
                                }}
                                className="w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                            >
                                View all alerts
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* User menu */}
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
                className="flex items-center gap-2 min-h-[44px] py-2 px-2 pr-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            >
    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center" >
        <span className="text-white text-sm font-medium" >
            { user?.firstName?.[0]}{ user?.lastName?.[0] }
</span>
    </div>
    < div className = "hidden md:block text-left" >
        <p className="text-sm font-medium text-gray-900 dark:text-white" >
            { user?.firstName } { user?.lastName }
</p>
    < p className = "text-xs text-gray-500 dark:text-gray-400 capitalize" >
        { user?.role?.replace('_', ' ') }
        </p>
        </div>
        </button>

            {/* Dropdown */}
            {showUserMenu && (
                <>
                    <div
                        role="presentation"
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                        aria-hidden
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        <button
                            type="button"
                            onClick={() => {
                                setShowUserMenu(false);
                                navigate('/settings');
                            }}
                            className="flex items-center gap-2 w-full px-4 py-3 min-h-[44px] text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
                        >
                            <User className="w-4 h-4 flex-shrink-0" />
                            Profile
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                            type="button"
                            onClick={logout}
                            className="flex items-center gap-2 w-full px-4 py-3 min-h-[44px] text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                        >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    </div>
    </div>
    </header>
  );
};
