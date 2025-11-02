import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Use the admin SDK
import {
    HabitTemplate,
    MonthlyGoal,
    HabitEntry,
    Milestone,
} from '@/types';
import { UserProfile, DashboardState, HabitStreak } from '@/lib/dashboardFunctions';

// Maximum number of days to look back when calculating streaks
const MAX_STREAK_CALCULATION_DAYS = 90;

/**
 * Calculate streak information for a habit based on its entries
 */
function calculateStreak(
    monthlyGoalId: string,
    entries: HabitEntry[],
    todayDate: string
): HabitStreak {
    // Filter entries for this goal and sort by date descending
    const goalEntries = entries
        .filter((e) => e.monthlyGoalId === monthlyGoalId)
        .sort((a, b) => b.targetDate.localeCompare(a.targetDate));

    if (goalEntries.length === 0) {
        return {
            currentStreak: 0,
            multiplier: 1.0,
            hasShield: false,
            shieldActive: false,
            lastCompletedDate: null,
        };
    }

    // Calculate current streak by checking consecutive days backwards from today
    let currentStreak = 0;
    const checkDate = new Date(todayDate);
    let missedToday = false;
    let shieldUsed = false;

    // Check if today has an entry
    const todayEntry = goalEntries.find((e) => e.targetDate === todayDate);
    if (!todayEntry) {
        missedToday = true;
        // Start checking from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days backwards
    while (true) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        const hasEntry = goalEntries.some((e) => e.targetDate === dateStr);

        if (hasEntry) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Missed a day - check if we can use shield
            if (currentStreak >= 7 && !shieldUsed) {
                // Shield protects this miss
                shieldUsed = true;
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            } else {
                // Streak ends
                break;
            }
        }

        // Safety check - don't go back too far
        if (currentStreak > MAX_STREAK_CALCULATION_DAYS) break;
    }

    // If we missed today but have a streak of 7+, shield is active
    const shieldActive = missedToday && currentStreak >= 7 && !shieldUsed;

    // Calculate multiplier based on streak
    let multiplier = 1.0;
    if (currentStreak >= 14) {
        multiplier = 1.5;
    } else if (currentStreak >= 7) {
        multiplier = 1.2;
    }

    const lastCompletedDate = goalEntries[0]?.targetDate || null;

    return {
        currentStreak,
        multiplier,
        hasShield: currentStreak >= 7,
        shieldActive,
        lastCompletedDate,
    };
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Fetch current user profile
        const userProfileDoc = await db.collection('users').doc(userId).get();
        if (!userProfileDoc.exists) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        const currentUserProfile = {
            uid: userProfileDoc.id,
            ...userProfileDoc.data(),
        } as UserProfile;

        // Fetch partner profile if exists
        let partnerProfile: UserProfile | null = null;
        let isSingleUser = false;

        if (currentUserProfile.partnerId) {
            const partnerDoc = await db.collection('users').doc(currentUserProfile.partnerId).get();
            if (partnerDoc.exists) {
                partnerProfile = {
                    uid: partnerDoc.id,
                    ...partnerDoc.data(),
                } as UserProfile;
            }
        } else {
            isSingleUser = true;
        }

        // Fetch all habit data for current user and partner
        const [
            userHabitTemplatesSnap,
            userMonthlyGoalsSnap,
            userHabitEntriesSnap,
            userMilestonesSnap,
        ] = await Promise.all([
            db.collection('habits').where('userId', '==', userId).get(),
            db.collection('monthlyGoals').where('userId', '==', userId).get(),
            db.collection('habitEntries').where('userId', '==', userId).get(),
            db.collection('milestones').where('userId', '==', userId).get(),
        ]);

        const userHabitTemplates = userHabitTemplatesSnap.docs.map(
            (doc) =>
            ({
                habitId: doc.id,
                ...doc.data(),
            } as HabitTemplate)
        );

        const userMonthlyGoals = userMonthlyGoalsSnap.docs.map(
            (doc) =>
            ({
                monthlyGoalId: doc.id,
                ...doc.data(),
            } as MonthlyGoal)
        );

        const userHabitEntries = userHabitEntriesSnap.docs.map(
            (doc) =>
            ({
                entryId: doc.id,
                ...doc.data(),
            } as HabitEntry)
        );

        const milestones = userMilestonesSnap.docs.map(
            (doc) =>
            ({
                milestoneId: doc.id,
                ...doc.data(),
            } as Milestone)
        );

        // Fetch partner data if exists
        let partnerMonthlyGoals: MonthlyGoal[] = [];
        let partnerHabitEntries: HabitEntry[] = [];

        if (partnerProfile) {
            const [
                partnerMonthlyGoalsSnap,
                partnerHabitEntriesSnap,
            ] = await Promise.all([
                db.collection('monthlyGoals').where('userId', '==', partnerProfile.uid).get(),
                db.collection('habitEntries').where('userId', '==', partnerProfile.uid).get(),
            ]);

            partnerMonthlyGoals = partnerMonthlyGoalsSnap.docs.map(
                (doc) =>
                ({
                    monthlyGoalId: doc.id,
                    ...doc.data(),
                } as MonthlyGoal)
            );

            partnerHabitEntries = partnerHabitEntriesSnap.docs.map(
                (doc) =>
                ({
                    entryId: doc.id,
                    ...doc.data(),
                } as HabitEntry)
            );
        }

        // Calculate today's habits
        const today = new Date().toISOString().slice(0, 10);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const userGoals = userMonthlyGoals.filter(
            (goal) => goal.userId === userId && goal.month === currentMonth
        );

        const todaysHabits = userGoals.map((goal) => {
            const template = userHabitTemplates.find(
                (t) => t.habitId === goal.habitId
            );
            const entry = userHabitEntries.find(
                (e) => e.monthlyGoalId === goal.monthlyGoalId && e.targetDate === today
            );

            // Calculate streak
            const streak = calculateStreak(goal.monthlyGoalId, userHabitEntries, today);

            // Calculate recent history (last 7 days)
            const recentHistory: boolean[] = [];
            for (let i = 6; i >= 0; i--) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().slice(0, 10);
                const hasEntry = userHabitEntries.some(
                    (e) => e.monthlyGoalId === goal.monthlyGoalId && e.targetDate === dateStr
                );
                recentHistory.push(hasEntry);
            }

            return {
                goal,
                template,
                entry,
                today,
                streak,
                recentHistory,
            };
        });

        // Calculate yesterday's habits
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().slice(0, 10);

        const yesterdayHabits = userGoals.map((goal) => {
            const template = userHabitTemplates.find(
                (t) => t.habitId === goal.habitId
            );
            const entries = userHabitEntries.filter(
                (entry) =>
                    entry.monthlyGoalId === goal.monthlyGoalId &&
                    entry.targetDate === yesterdayDate
            );

            // Calculate streak
            const streak = calculateStreak(goal.monthlyGoalId, userHabitEntries, today);

            return {
                goal,
                template,
                entries,
                isCompleted: entries.length > 0,
                canCompleteToday:
                    goal.logging.allowNextDayCompletion && entries.length === 0,
                yesterdayDate,
                streak,
            };
        });

        // Calculate weekly data
        const usersToShow = [
            {
                profile: currentUserProfile,
                goals: userMonthlyGoals,
                entries: userHabitEntries,
            },
        ];
        if (partnerProfile) {
            usersToShow.push({
                profile: partnerProfile,
                goals: partnerMonthlyGoals,
                entries: partnerHabitEntries,
            });
        }

        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay();
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - currentDayOfWeek + i);
            return date.toISOString().slice(0, 10);
        });

        const weeklyData = usersToShow.map((user, userIndex) => {
            const days = weekDays.map((date) => {
                const dayEntries = user.entries.filter(
                    (entry) =>
                        entry.userId === user.profile.uid && entry.targetDate === date
                );
                return dayEntries.length > 0;
            });

            return {
                user: user.profile.name.charAt(0).toUpperCase(),
                days,
                userIndex,
            };
        });

        const dashboardState: DashboardState = {
            currentUserProfile,
            partnerProfile,
            isSingleUser,
            todaysHabits,
            yesterdayHabits,
            weeklyData,
            milestones,
        };

        return NextResponse.json(dashboardState);
    } catch (error: any) {
        console.error('Error fetching dashboard state:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard state' },
            { status: 500 }
        );
    }
}
