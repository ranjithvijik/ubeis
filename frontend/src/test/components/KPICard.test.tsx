import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { KPICard } from '../../components/dashboard/KPICard';
import { KPI } from '../../types';

const mockKPI: KPI = {
    kpiId: 'kpi-001',
    name: 'Total Enrollment',
    description: 'Total student enrollment',
    category: 'enrollment',
    currentValue: 5234,
    previousValue: 5100,
    targetValue: 5500,
    unit: 'students',
    threshold: { critical: 4500, warning: 5000 },
    thresholdType: 'min',
    status: 'on_target',
    trend: 'up',
    changePercent: 2.6,
    history: [],
    lastUpdated: '2026-03-09T15:30:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{ component } </BrowserRouter>);
};

describe('KPICard', () => {
    it('renders KPI name and value', () => {
        renderWithRouter(<KPICard kpi={ mockKPI } />);

        expect(screen.getByText('Total Enrollment')).toBeInTheDocument();
        expect(screen.getByText('5,234')).toBeInTheDocument();
    });

    it('displays correct status badge', () => {
        renderWithRouter(<KPICard kpi={ mockKPI } />);

        expect(screen.getByText('On Target')).toBeInTheDocument();
    });

    it('shows trend indicator', () => {
        renderWithRouter(<KPICard kpi={ mockKPI } />);

        expect(screen.getByText('2.6%')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        renderWithRouter(<KPICard kpi={ mockKPI } onClick = { handleClick } />);

        fireEvent.click(screen.getByText('Total Enrollment'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders at_risk status correctly', () => {
        const atRiskKPI = { ...mockKPI, status: 'at_risk' as const };
        renderWithRouter(<KPICard kpi={ atRiskKPI } />);

        expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('renders below_target status correctly', () => {
        const belowTargetKPI = { ...mockKPI, status: 'below_target' as const };
        renderWithRouter(<KPICard kpi={ belowTargetKPI } />);

        expect(screen.getByText('Below Target')).toBeInTheDocument();
    });

    it('shows progress bar', () => {
        renderWithRouter(<KPICard kpi={ mockKPI } />);

        expect(screen.getByText('Progress to Target')).toBeInTheDocument();
    });

    it('displays View Details link', () => {
        renderWithRouter(<KPICard kpi={ mockKPI } />);

        expect(screen.getByText('View Details')).toBeInTheDocument();
    });
});
