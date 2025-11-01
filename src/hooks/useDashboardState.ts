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

        let isMounted = true;

        const fetchDashboardState = async () => {
            try {
                setLoading(true);
                const state = await getDashboardStateFromFunction(user.uid);
                if (isMounted) {
                    setDashboardState(state);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch dashboard state');
                    console.error('Error fetching dashboard state:', err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardState();

        return () => {
            isMounted = false;
        };
    }, [user]);

    return {
        dashboardState,
        loading,
        error,
    };
}
