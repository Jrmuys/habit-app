import * as admin from 'firebase-admin';
import { MonthlyGoal } from './types';

/**
 * Creates a monthly goal for an existing habit
 */
export async function createMonthlyGoal(
    userId: string,
    goalData: {
        habitId: string;
        month: string;
        ui: any;
        goal: any;
        logging: any;
        constraints?: any[];
    }
): Promise<string> {
    const db = admin.firestore();

    // Validate input
    if (!goalData.habitId) {
        throw new Error('Habit ID is required');
    }
    if (!goalData.month) {
        throw new Error('Month is required');
    }

    // Verify the habit exists and belongs to the user
    const habitDoc = await db.collection('habits').doc(goalData.habitId).get();
    if (!habitDoc.exists) {
        throw new Error('Habit not found');
    }
    
    const habitData = habitDoc.data();
    if (habitData?.userId !== userId) {
        throw new Error('Unauthorized: Habit does not belong to user');
    }

    // Create monthly goal
    const newGoal: Omit<MonthlyGoal, 'monthlyGoalId'> = {
        userId,
        habitId: goalData.habitId,
        month: goalData.month,
        ui: goalData.ui,
        goal: goalData.goal,
        logging: goalData.logging,
        constraints: goalData.constraints || [],
    };

    try {
        // Write to top-level collection (will be migrated to subcollection in Phase 2)
        const goalRef = await db.collection('monthlyGoals').add(newGoal);
        return goalRef.id;
    } catch (error) {
        console.error('Error creating monthly goal:', error);
        throw new Error('Failed to create monthly goal');
    }
}
