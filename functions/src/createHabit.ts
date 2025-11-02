import * as admin from 'firebase-admin';
import { HabitTemplate, MonthlyGoal } from './types';

/**
 * Creates a habit template and optionally a monthly goal for the current month
 */
export async function createHabit(
    userId: string,
    habitData: {
        name: string;
        description?: string;
        icon?: string;
        allowShowUp?: boolean;
        showUpPoints?: number;
        createMonthlyGoal?: boolean;
        monthlyGoalConfig?: {
            month?: string;
            ui?: any;
            goal?: any;
            logging?: any;
            constraints?: any[];
        };
    }
): Promise<{ habitId: string; monthlyGoalId?: string }> {
    const db = admin.firestore();

    // Validate input
    if (!habitData.name || habitData.name.trim().length === 0) {
        throw new Error('Habit name is required');
    }

    // Create habit template
    // Note: basePoints defaults to 100, partialPoints is hardcoded to 25 per architecture
    const newTemplate: Omit<HabitTemplate, 'habitId'> = {
        userId,
        name: habitData.name.trim(),
        description: habitData.description?.trim(),
        icon: habitData.icon,
        allowShowUp: habitData.allowShowUp,
        showUpPoints: habitData.showUpPoints || 1,
        basePoints: 100, // Hardcoded per architecture
        partialPoints: 25, // Hardcoded per architecture
        createdAt: new Date().toISOString(),
    };

    try {
        // Write to subcollection under users/{userId}/habitLibrary
        const habitRef = await db
            .collection('users')
            .doc(userId)
            .collection('habitLibrary')
            .add(newTemplate);
        const habitId = habitRef.id;

        let monthlyGoalId: string | undefined;

        // Create monthly goal if requested
        if (habitData.createMonthlyGoal) {
            const currentMonth = habitData.monthlyGoalConfig?.month || 
                new Date().toISOString().slice(0, 7);
            
            const newGoal: Omit<MonthlyGoal, 'monthlyGoalId'> = {
                userId,
                habitId,
                month: currentMonth,
                ui: habitData.monthlyGoalConfig?.ui || { type: 'CHECKBOX' },
                goal: habitData.monthlyGoalConfig?.goal || {
                    period: 'DAILY',
                    frequency: 1,
                },
                logging: habitData.monthlyGoalConfig?.logging || {
                    window: {
                        startOffsetHours: 0,
                        endOffsetHours: 24,
                    },
                },
                constraints: habitData.monthlyGoalConfig?.constraints || [],
            };

            const goalRef = await db
                .collection('users')
                .doc(userId)
                .collection('monthlyGoals')
                .add(newGoal);
            monthlyGoalId = goalRef.id;
        }

        return { habitId, monthlyGoalId };
    } catch (error) {
        console.error('Error creating habit:', error);
        throw new Error('Failed to create habit');
    }
}
