import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { useTheme } from '../../hooks/useTheme';
import clsx from 'clsx';

export const DashboardLayout: React.FC = () => {
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
        <div className= { clsx('min-h-screen', theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50')
}>
    {/* Sidebar */ }
    < Sidebar isOpen = { sidebarOpen } onToggle = {() => setSidebarOpen(!sidebarOpen)} />

{/* Main content */ }
<div
        className={
    clsx(
        'transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-20'
    )
}
      >
    {/* Header */ }
    < Header onMenuClick = {() => setSidebarOpen(!sidebarOpen)} />

{/* Page content */ }
<main className="p-6" >
    <Outlet />
    </main>
    </div>
    </div>
  );
};
