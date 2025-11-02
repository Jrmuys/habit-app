import { MonthlyGoal, HabitTemplate, HabitEntry } from '@/types';

export type UserProfile = {
    uid: string;
    email: string;
    name: string;
    points: number;
    partnerId?: string;
};

export type DashboardState = {
    currentUserProfile: UserProfile;
    partnerProfile: UserProfile | null;
    isSingleUser: boolean;
    todaysHabits: Array<{
        goal: MonthlyGoal;
        template: HabitTemplate | undefined;
        entry: HabitEntry | undefined;
        today: string;
    }>;
    yesterdayHabits: Array<{
        goal: MonthlyGoal;
        template: HabitTemplate | undefined;
        entries: HabitEntry[];
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
export async function getDashboardStateFromFunction(
    userId: string,
    idToken: string
): Promise<DashboardState> {
    const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard state');
    }

    return response.json();
}

// Note: Habit entry logging is handled directly in useHabitsSimplified hook
// using direct Firestore writes. An API route can be added here if needed in the future.
