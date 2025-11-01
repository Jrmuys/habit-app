export type DashboardState = {
    currentUserProfile: {
        uid: string;
        email: string;
        name: string;
        points: number;
        partnerId?: string;
    };
    partnerProfile: {
        uid: string;
        email: string;
        name: string;
        points: number;
        partnerId?: string;
    } | null;
    isSingleUser: boolean;
    todaysHabits: Array<{
        goal: any;
        template: any;
        entry: any;
        today: string;
    }>;
    yesterdayHabits: Array<{
        goal: any;
        template: any;
        entries: any[];
        isCompleted: boolean;
        canCompleteToday: boolean;
        yesterdayDate: string;
    }>;
    weeklyData: Array<{
        user: string;
        days: boolean[];
        userIndex: number;
    }>;
};

/**
 * Calls the API route to get dashboard state
 */
export async function getDashboardStateFromFunction(userId: string): Promise<DashboardState> {
    const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard state');
    }

    return response.json();
}

/**
 * Calls the direct Firestore to log a habit entry
 * (Can be replaced with API route if needed)
 */
export async function logHabitEntryViaFunction(entryData: {
    monthlyGoalId: string;
    targetDate: string;
    value: string | number | boolean;
}): Promise<{ entryId: string; success: boolean }> {
    // For now, this will still use direct Firestore write
    // This can be refactored to use an API route if needed
    throw new Error('Use the direct logHabitEntry from useHabits hook');
}
