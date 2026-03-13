import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Bell,
    FileText,
    Settings,
    ChevronLeft,
    Shield,
} from 'lucide-react';
import clsx from 'clsx';
import ubaltLogo from '../../assets/ubalt-logo.svg';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/kpis', label: 'KPIs', icon: BarChart3 },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const location = useLocation();
    const closeOnNavigate = () => {
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            onToggle();
        }
    };
    const navItems =
        location.pathname.startsWith('/admin')
            ? [...baseNavItems, { path: '/admin/users', label: 'Admin Users', icon: Shield }]
            : baseNavItems;

    return (
        <aside
            className={clsx(
                'fixed left-0 top-0 h-full text-white transition-all duration-300 z-50 bg-gradient-to-b from-sky-900 via-sky-800 to-sky-950 shadow-2xl/40 shadow-black/40 backdrop-blur-md border-r border-sky-800/70',
                'w-64',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                'md:translate-x-0',
                isOpen ? 'md:w-64' : 'md:w-20'
            )}
        >
        {/* Logo */ }
        < div className = "flex items-center justify-between h-16 px-4 border-b border-sky-800/70 bg-sky-950/40 backdrop-blur" >
            <div className="flex items-center gap-3" >
                {!isOpen && (
                    <div className="w-10 h-10 rounded-xl bg-sky-900/80 border border-sky-500/40 shadow-lg shadow-sky-900/40 flex items-center justify-center overflow-hidden" >
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <img
                                src={ubaltLogo}
                                alt="UBalt"
                                className="h-6 w-auto object-contain"
                            />
                        </div>
                    </div>
                )}
    {
        isOpen && (
            <div className="leading-tight">
            <h1 className="font-semibold text-sm tracking-wide uppercase text-sky-100" > UBalt EIS </h1>
                < p className = "text-[11px] text-sky-300/80" > Executive Information System </p>
                    </div>
          )}
</div>
            <button
                type="button"
                onClick={onToggle}
                aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-sky-800/70 rounded-lg border border-sky-700/70 transition-colors touch-manipulation"
            >
    <ChevronLeft
            className={
    clsx(
        'w-4 h-4 text-sky-100 transition-transform',
        !isOpen && 'rotate-180'
    )
}
          />
    </button>
    </div>

{/* Navigation */ }
        <nav className="p-3 space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeOnNavigate}
                        className={clsx(
                            'group flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors relative overflow-hidden touch-manipulation',
                            isActive
                                ? 'bg-sky-100 text-sky-900 shadow-sm shadow-sky-900/40'
                                : 'text-sky-100/80 hover:bg-sky-900/70 hover:text-white active:bg-sky-800/80'
                        )}
                    >
                        {isActive && (
                            <span className="absolute left-0 top-0 h-full w-0.5 bg-sky-400" />
                        )}
                        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                        {isOpen && (
                            <span className="font-medium text-sm tracking-wide">{item.label}</span>
                        )}
                    </NavLink>
                );
            })}
        </nav>

{/* Footer */ }
{
    isOpen && (
        <div className="absolute bottom-4 left-4 right-4" >
            <div className="p-3 rounded-xl bg-sky-900/70 border border-sky-700/80 shadow-lg shadow-black/40" >
                <p className="text-xs text-sky-100 font-medium" >
                    University of Baltimore
                </p>
                <p className="text-[11px] text-sky-300/80 mt-1">
                  © 2026 University of Baltimore
                </p>
            </div>
        </div>
      )
}
</aside>
  );
};
