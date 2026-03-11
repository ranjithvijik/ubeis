import React from 'react';
import { Menu, Bell, Search, Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useAlerts } from '../../hooks/useAlerts';
import ubaltLogo from '../../assets/ubalt-logo.svg';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { data: alertsData } = useAlerts({ status: 'active' });
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    const criticalCount = alertsData?.items.filter((a) => a.severity === 'critical').length || 0;

    return (
        <header className= "sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" >
        <div className="flex items-center justify-between h-16 px-4" >
            {/* Left side */ }
            < div className = "flex items-center gap-4" >
                <button
            onClick={ onMenuClick }
    className = "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg" >
        <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
    placeholder = "Search KPIs, alerts..."
    className = "bg-transparent border-none outline-none text-sm w-64 text-gray-700 dark:text-gray-200 placeholder-gray-500"
        />
        </div>
        </div>

    {/* Right side */ }
    <div className="flex items-center gap-3" >
        {/* Theme toggle */ }
        < button
    onClick = { toggleTheme }
    className = "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
        { theme === 'dark' ? (
            <Sun className= "w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
    <Moon className= "w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
</button>

{/* Notifications */ }
<button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" >
    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        { criticalCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center" >
                { criticalCount }
                </span>
            )}
</button>

{/* User menu */ }
<div className="relative" >
    <button
              onClick={ () => setShowUserMenu(!showUserMenu) }
className = "flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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

{/* Dropdown */ }
{
    showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1" >
            <button
                  onClick={ () => {/* Navigate to profile */ } }
    className = "flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
        <User className="w-4 h-4" />
            Profile
            </button>
            < hr className = "my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={ logout }
    className = "flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
        <LogOut className="w-4 h-4" />
            Sign Out
                </button>
                </div>
            )
}
</div>
    </div>
    </div>
    </header>
  );
};
