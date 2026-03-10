import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { DashboardFilters, KPICategory } from '../../types';

interface FilterPanelProps {
    filters: DashboardFilters;
    onFilterChange: (filters: DashboardFilters) => void;
}

const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
] as const;

const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'enrollment', label: 'Enrollment' },
    { value: 'financial', label: 'Financial' },
    { value: 'academic', label: 'Academic' },
    { value: 'research', label: 'Research' },
    { value: 'operations', label: 'Operations' },
] as const;

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onFilterChange,
}) => {
    return (
        <div className= "flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm" >
        {/* Period Filter */ }
        < div className = "flex items-center gap-2" >
            <Calendar className="w-4 h-4 text-gray-500" />
                <select
          value={ filters.period }
    onChange = {(e) =>
onFilterChange({ ...filters, period: e.target.value as DashboardFilters['period'] })
          }
className = "px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
{
    periods.map((period) => (
        <option key= { period.value } value = { period.value } >
        { period.label }
        </option>
    ))
}
    </select>
    </div>

{/* Category Filter */ }
<div className="flex items-center gap-2" >
    <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={ filters.category }
onChange = {(e) =>
onFilterChange({
    ...filters,
    category: e.target.value as KPICategory | 'all',
})
          }
className = "px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
{
    categories.map((category) => (
        <option key= { category.value } value = { category.value } >
        { category.label }
        </option>
    ))
}
    </select>
    </div>

{/* Reset Button */ }
<button
        onClick={ () => onFilterChange({ period: 'monthly', category: 'all' }) }
className = "px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
    >
    Reset Filters
        </button>
        </div>
  );
};
