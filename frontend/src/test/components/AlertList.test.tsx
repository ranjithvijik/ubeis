import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertList } from '../../components/alerts/AlertList';
import { Alert } from '../../types';

const mockAlerts: Alert[] = [
    {
        alertId: 'alert-001',
        kpiId: 'kpi-001',
        kpiName: 'Enrollment Rate',
        severity: 'critical',
        message: 'Enrollment has fallen below critical threshold',
        currentValue: 4200,
        threshold: 4500,
        status: 'active',
        createdAt: '2026-03-09T15:30:00Z',
    },
    {
        alertId: 'alert-002',
        kpiId: 'kpi-002',
        kpiName: 'Budget Utilization',
        severity: 'warning',
        message: 'Budget utilization approaching limit',
        currentValue: 0.95,
        threshold: 0.98,
        status: 'acknowledged',
        acknowledgedBy: 'admin@ubalt.edu',
        acknowledgedAt: '2026-03-09T16:00:00Z',
        createdAt: '2026-03-09T14:00:00Z',
    },
];

describe('AlertList', () => {
    it('renders list of alerts', () => {
        render(<AlertList alerts={ mockAlerts } />);

        expect(screen.getByText('Enrollment Rate')).toBeInTheDocument();
        expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
    });

    it('displays severity badges', () => {
        render(<AlertList alerts={ mockAlerts } />);

        expect(screen.getByText('CRITICAL')).toBeInTheDocument();
        expect(screen.getByText('WARNING')).toBeInTheDocument();
    });

    it('shows acknowledge button for active alerts', () => {
        const onAcknowledge = vi.fn();
        render(<AlertList alerts={ mockAlerts } onAcknowledge = { onAcknowledge } />);

        const acknowledgeButton = screen.getByText('Acknowledge');
        expect(acknowledgeButton).toBeInTheDocument();

        fireEvent.click(acknowledgeButton);
        expect(onAcknowledge).toHaveBeenCalledWith('alert-001');
    });

    it('shows resolve button for acknowledged alerts', () => {
        const onResolve = vi.fn();
        render(<AlertList alerts={ mockAlerts } onResolve = { onResolve } />);

        const resolveButton = screen.getByText('Resolve');
        expect(resolveButton).toBeInTheDocument();

        fireEvent.click(resolveButton);
        expect(onResolve).toHaveBeenCalledWith('alert-002');
    });

    it('displays empty state when no alerts', () => {
        render(<AlertList alerts={ []} />);

        expect(screen.getByText('No Active Alerts')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<AlertList alerts={ []} isLoading = { true} />);

        // Check for skeleton loaders
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays acknowledged by information', () => {
        render(<AlertList alerts={ mockAlerts } />);

        expect(screen.getByText(/Acknowledged by admin@ubalt.edu/)).toBeInTheDocument();
    });
});
