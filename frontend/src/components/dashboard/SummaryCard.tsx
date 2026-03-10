import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface SummaryCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    description?: string;
    percentage?: number;
    isLoading?: boolean;
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-500',
        text: 'text-blue-700 dark:text-blue-300',
    },
    green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-500',
        text: 'text-green-700 dark:text-green-300',
    },
    yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-300',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-500',
        text: 'text-red-700 dark:text-red-300',
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-500',
        text: 'text-purple-700 dark:text-purple-300',
    },
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    description,
    percentage,
    isLoading = false,
}) => {
    const colors = colorClasses[color];

    if (isLoading) {
        return (
            <div className= "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse" >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                        </div>
    );
  }

return (
    <div className= "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" >
    <div className="flex items-center justify-between mb-2" >
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400" >
            { title }
            </span>
            < div className = { clsx('p-2 rounded-lg', colors.bg) } >
                <Icon className={ clsx('w-4 h-4', colors.icon) } />
                    </div>
                    </div>

                    < div className = "flex items-baseline gap-2" >
                        <span className="text-2xl font-bold text-gray-900 dark:text-white" >
                            { value.toLocaleString() }
                            </span>
{
    percentage !== undefined && (
        <span className={ clsx('text-sm font-medium', colors.text) }>
            { percentage } %
            </span>
        )
}
</div>

{
    description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" >
            { description }
            </p>
      )
}
</div>
  );
};
