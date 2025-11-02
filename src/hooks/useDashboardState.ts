'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getDashboardStateFromFunction, DashboardState } from '@/lib/dashboardFunctions';

/**
 * Hook to fetch dashboard state from Firebase Function
 * This replaces the complex useMemo calculations with a server-side call
 */
export function useDashboardState() {
    const { user } = useAuth();
    const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setDashboardState(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchDashboardState = async () => {
            try {
                setLoading(true);
                const idToken = await user.getIdToken();
                const state = await getDashboardStateFromFunction(user.uid, idToken);
                setDashboardState(state);
                setError(null);
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
                    // Request was aborted, do not update state
                    return;
                }
                setError(err instanceof Error ? err.message : 'Failed to fetch dashboard state');
                console.error('Error fetching dashboard state:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardState();

        return () => {
            controller.abort();
        };
    }, [user]);

    return {
        dashboardState,
        loading,
        error,
    };
}
