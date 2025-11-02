import * as admin from 'firebase-admin';
import {
    HabitTemplate,
    MonthlyGoal,
    HabitEntry,
    UserProfile,
    DashboardState,
    Milestone,
} from './types';
import { calculateStreak, getRecentHistory } from './streakCalculations';

/**
 * Fetches the dashboard state for a user
 * This function contains all the business logic previously in useMemo hooks
 */
export async function getDashboardState(
    userId: string
): Promise<DashboardState> {
    const db = admin.firestore();

    // Fetch current user profile
    const userProfileDoc = await db.collection('users').doc(userId).get();
    if (!userProfileDoc.exists) {
        throw new Error('User profile not found');
    }
    const currentUserProfile = {
        uid: userProfileDoc.id,
        ...userProfileDoc.data(),
    } as UserProfile;

    // Fetch partner profile if exists
    let partnerProfile: UserProfile | null = null;
    let isSingleUser = false;

    if (currentUserProfile.partnerId) {
        const partnerDoc = await db
            .collection('users')
            .doc(currentUserProfile.partnerId)
            .get();
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
        partnerHabitTemplatesSnap,
        partnerMonthlyGoalsSnap,
        partnerHabitEntriesSnap,
    ] = await Promise.all([
        db.collection('habits').where('userId', '==', userId).get(),
        db.collection('monthlyGoals').where('userId', '==', userId).get(),
        db.collection('habitEntries').where('userId', '==', userId).get(),
        db.collection('milestones').where('userId', '==', userId).get(),
        partnerProfile
            ? db
                  .collection('habits')
                  .where('userId', '==', partnerProfile.uid)
                  .get()
            : Promise.resolve({ docs: [] } as any),
        partnerProfile
            ? db
                  .collection('monthlyGoals')
                  .where('userId', '==', partnerProfile.uid)
                  .get()
            : Promise.resolve({ docs: [] } as any),
        partnerProfile
            ? db
                  .collection('habitEntries')
                  .where('userId', '==', partnerProfile.uid)
                  .get()
            : Promise.resolve({ docs: [] } as any),
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

    // Partner templates are fetched but not currently used in dashboard calculation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const partnerHabitTemplates = partnerHabitTemplatesSnap.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot) =>
            ({
                habitId: doc.id,
                ...doc.data(),
            } as HabitTemplate)
    );

    const partnerMonthlyGoals = partnerMonthlyGoalsSnap.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot) =>
            ({
                monthlyGoalId: doc.id,
                ...doc.data(),
            } as MonthlyGoal)
    );

    const partnerHabitEntries = partnerHabitEntriesSnap.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot) =>
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
        
        // Get all entries for this goal to calculate streak
        const goalEntries = userHabitEntries.filter(
            (e) => e.monthlyGoalId === goal.monthlyGoalId
        );
        
        const streak = calculateStreak(goalEntries, template, today);
        const recentHistory = getRecentHistory(goalEntries, today);

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
        
        // Get all entries for this goal to calculate streak
        const goalEntries = userHabitEntries.filter(
            (e) => e.monthlyGoalId === goal.monthlyGoalId
        );
        
        const streak = calculateStreak(goalEntries, template, today);

        return {
            goal,
            template,
            entries,
            isCompleted: entries.length > 0,
            canCompleteToday:
                !!goal.logging.allowNextDayCompletion && entries.length === 0,
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

    return {
        currentUserProfile,
        partnerProfile,
        isSingleUser,
        todaysHabits,
        yesterdayHabits,
        weeklyData,
        milestones,
    };
}
