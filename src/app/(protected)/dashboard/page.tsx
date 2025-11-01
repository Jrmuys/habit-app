'use client';

import { useDashboardState } from '@/hooks/useDashboardState';
import DashboardClient from '@/components/DashboardClient';

export default function DashboardPage() {
    const { dashboardState, loading, error } = useDashboardState();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-slate-400">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-red-400">Error: {error}</div>
            </div>
        );
    }

    if (!dashboardState) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-slate-400">No dashboard data available</div>
            </div>
        );
    }

    return <DashboardClient dashboardState={dashboardState} />;
}
