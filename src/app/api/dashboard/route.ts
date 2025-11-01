import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    HabitTemplate,
    MonthlyGoal,
    HabitEntry,
} from '@/types';

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
        const userProfileDoc = await getDoc(doc(db, 'users', userId));
        if (!userProfileDoc.exists()) {
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
            const partnerDoc = await getDoc(doc(db, 'users', currentUserProfile.partnerId));
            if (partnerDoc.exists()) {
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
        ] = await Promise.all([
            getDocs(query(collection(db, 'habits'), where('userId', '==', userId))),
            getDocs(query(collection(db, 'monthlyGoals'), where('userId', '==', userId))),
            getDocs(query(collection(db, 'habitEntries'), where('userId', '==', userId))),
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

        // Fetch partner data if exists
        let partnerMonthlyGoals: MonthlyGoal[] = [];
        let partnerHabitEntries: HabitEntry[] = [];

        if (partnerProfile) {
            const [
                partnerMonthlyGoalsSnap,
                partnerHabitEntriesSnap,
            ] = await Promise.all([
                getDocs(query(collection(db, 'monthlyGoals'), where('userId', '==', partnerProfile.uid))),
                getDocs(query(collection(db, 'habitEntries'), where('userId', '==', partnerProfile.uid))),
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

            return {
                goal,
                template,
                entry,
                today,
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

            return {
                goal,
                template,
                entries,
                isCompleted: entries.length > 0,
                canCompleteToday:
                    (goal.logging.allowNextDayCompletion || false) && entries.length === 0,
                yesterdayDate,
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
        };

        return NextResponse.json(dashboardState);
    } catch (error) {
        console.error('Error fetching dashboard state:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard state' },
            { status: 500 }
        );
    }
}
