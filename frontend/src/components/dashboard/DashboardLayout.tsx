import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { useTheme } from '../../hooks/useTheme';
import clsx from 'clsx';

export const DashboardLayout: React.FC = () => {
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className={clsx('min-h-screen', theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50')}>
            {/* Mobile backdrop when sidebar open */}
            <div
                role="button"
                tabIndex={-1}
                aria-label="Close menu"
                className={clsx(
                    'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
                    sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={closeSidebar}
                onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
            />

            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main: full width on mobile, offset on desktop when sidebar present */}
            <div
                className={clsx(
                    'min-h-screen transition-all duration-300',
                    sidebarOpen ? 'md:ml-64' : 'md:ml-20'
                )}
            >
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="p-4 sm:p-6 max-w-[1920px]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
