import { MonthlyGoal, HabitTemplate, HabitEntry, Milestone } from '@/types';

export type UserProfile = {
    uid: string;
    email: string;
    name: string;
    points: number;
    partnerId?: string;
};

export type HabitStreak = {
    currentStreak: number; // Number of consecutive days
    multiplier: number; // 1.0, 1.2, or 1.5
    hasShield: boolean; // True if earned at 7+ days
    shieldActive: boolean; // True if shield is protecting a current miss
    lastCompletedDate: string | null;
};

export type DashboardHabit = {
    goal: MonthlyGoal;
    template: HabitTemplate | undefined;
    entry: HabitEntry | undefined;
    today: string;
    streak: HabitStreak;
    recentHistory: boolean[]; // Last 7 days, most recent last
};

export type DashboardState = {
    currentUserProfile: UserProfile;
    partnerProfile: UserProfile | null;
    isSingleUser: boolean;
    todaysHabits: DashboardHabit[];
    yesterdayHabits: Array<{
        goal: MonthlyGoal;
        template: HabitTemplate | undefined;
        entries: HabitEntry[];
        isCompleted: boolean;
        canCompleteToday: boolean;
        yesterdayDate: string;
        streak: HabitStreak;
    }>;
    weeklyData: Array<{
        user: string;
        days: boolean[];
        userIndex: number;
    }>;
    milestones: Milestone[];
};

/**
 * Calls the API route to get dashboard state
 */
export async function getDashboardStateFromFunction(userId: string, signal?: AbortSignal): Promise<DashboardState> {
    const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        signal,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard state');
    }

    return response.json();
}

// Note: Habit entry logging is handled directly in useHabitsSimplified hook
// using direct Firestore writes. An API route can be added here if needed in the future.
