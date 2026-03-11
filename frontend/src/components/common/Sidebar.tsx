import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Bell,
    FileText,
    Settings,
    ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';
import ubaltLogo from '../../assets/ubalt-logo.svg';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/kpis', label: 'KPIs', icon: BarChart3 },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const location = useLocation();

    return (
        <aside
      className= {
            clsx(
        'fixed left-0 top-0 h-full bg-primary-500 text-white transition-all duration-300 z-50',
                isOpen? 'w-64' : 'w-20'
            )
        }
        >
        {/* Logo */ }
        < div className = "flex items-center justify-between h-16 px-4 border-b border-primary-400" >
            <div className="flex items-center gap-3" >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden" >
                    <img
                        src={ubaltLogo}
                        alt="UBalt"
                        className="h-7 w-auto"
                    />
                </div>
    {
        isOpen && (
            <div>
            <h1 className="font-bold text-lg" > UBalt EIS </h1>
                < p className = "text-xs text-primary-200" > Executive Dashboard </p>
                    </div>
          )}
</div>
    < button
onClick = { onToggle }
className = "p-1 hover:bg-primary-400 rounded-lg transition-colors"
    >
    <ChevronLeft
            className={
    clsx(
        'w-5 h-5 transition-transform',
        !isOpen && 'rotate-180'
    )
}
          />
    </button>
    </div>

{/* Navigation */ }
<nav className="p-4 space-y-2" >
{
    navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);

        return (
            <NavLink
              key= { item.path }
        to = { item.path }
        className = {
            clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                    ? 'bg-white text-primary-500'
                  : 'text-primary-100 hover:bg-primary-400'
            )
        }
            >
            <Icon className="w-5 h-5 flex-shrink-0" />
                { isOpen && (
                    <span className="font-medium" > { item.label } </span>
              )
}
    </NavLink>
          );
        })}
</nav>

{/* Footer */ }
{
    isOpen && (
        <div className="absolute bottom-4 left-4 right-4" >
            <div className="p-3 bg-primary-400 rounded-lg" >
                <p className="text-xs text-primary-100" >
                    University of Baltimore
                        </p>
                        < p className = "text-xs text-primary-200" >
              © 2026 All rights reserved
        </p>
        </div>
        </div>
      )
}
</aside>
  );
};
