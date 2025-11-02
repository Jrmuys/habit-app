import * as admin from 'firebase-admin';
import { HabitEntry, HabitTemplate, MonthlyGoal } from './types';
import { calculateStreak, calculatePoints } from './streakCalculations';

/**
 * Logs a habit entry to Firestore and awards points to the user
 */
export async function logHabitEntry(
    userId: string,
    entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>
): Promise<{ entryId: string; pointsAwarded: number }> {
    const db = admin.firestore();

    // Use a transaction to ensure consistency between entry creation and points update
    const result = await db.runTransaction(async (transaction) => {
        // Get the monthly goal to find the habit template
        const monthlyGoalRef = db
            .collection('users')
            .doc(userId)
            .collection('monthlyGoals')
            .doc(entryData.monthlyGoalId);
        const monthlyGoalDoc = await transaction.get(monthlyGoalRef);

        if (!monthlyGoalDoc.exists) {
            throw new Error('Monthly goal not found');
        }

        const monthlyGoal = {
            monthlyGoalId: monthlyGoalDoc.id,
            ...monthlyGoalDoc.data(),
        } as MonthlyGoal;

        // Get the habit template
        const habitTemplateRef = db
            .collection('users')
            .doc(userId)
            .collection('habitLibrary')
            .doc(monthlyGoal.habitId);
        const habitTemplateDoc = await transaction.get(habitTemplateRef);

        const habitTemplate = habitTemplateDoc.exists
            ? ({
                  habitId: habitTemplateDoc.id,
                  ...habitTemplateDoc.data(),
              } as HabitTemplate)
            : undefined;

        // Get all existing entries for this monthly goal to calculate streak
        // Limit to last 90 days for performance (streaks don't typically exceed this)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cutoffDate = ninetyDaysAgo.toISOString().slice(0, 10);
        
        const existingEntriesSnap = await db
            .collection('users')
            .doc(userId)
            .collection('habitEntries')
            .where('monthlyGoalId', '==', entryData.monthlyGoalId)
            .where('targetDate', '>=', cutoffDate)
            .get();

        const existingEntries = existingEntriesSnap.docs.map(
            (doc) =>
                ({
                    entryId: doc.id,
                    ...doc.data(),
                } as HabitEntry)
        );

        // Calculate streak with the new entry included
        const today = entryData.targetDate;
        const allEntries = [
            ...existingEntries,
            {
                entryId: 'CALCULATING_STREAK_TEMP', // Temporary ID for streak calculation only
                userId,
                timestamp: new Date().toISOString(),
                ...entryData,
            } as HabitEntry,
        ];

        const streakInfo = calculateStreak(allEntries, habitTemplate, today);

        // Calculate points for this entry
        const newEntry: Omit<HabitEntry, 'entryId'> = {
            ...entryData,
            userId,
            timestamp: new Date().toISOString(),
        };

        const pointsAwarded = calculatePoints(
            newEntry as HabitEntry,
            habitTemplate,
            streakInfo
        );

        // Create the entry
        const entryRef = db
            .collection('users')
            .doc(userId)
            .collection('habitEntries')
            .doc(); // Generate ID
        transaction.set(entryRef, newEntry);

        // Update user points
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const currentPoints = userDoc.data()?.points || 0;
        transaction.update(userRef, {
            points: currentPoints + pointsAwarded,
        });

        return { entryId: entryRef.id, pointsAwarded };
    });

    return result;
}
