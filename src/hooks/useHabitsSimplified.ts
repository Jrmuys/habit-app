'use client'

import { useAuth } from '@/hooks/useAuth';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HabitTemplate, MonthlyGoal, HabitEntry } from '@/types';
import * as firebaseFunctions from '@/lib/firebaseFunctions';

/**
 * Simplified useHabits hook - uses Firebase Callable Functions for writes
 * Data fetching is now handled by server-side functions
 */
export function useHabitsSimplified() {
    const { user } = useAuth();

    // The following actions are only for the current user
    const createHabitTemplate = async (templateData: Omit<HabitTemplate, 'habitId' | 'userId' | 'createdAt'>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const result = await firebaseFunctions.createHabit({
                name: templateData.name,
                description: templateData.description,
                icon: templateData.icon,
                allowShowUp: templateData.allowShowUp,
                showUpPoints: templateData.showUpPoints,
                createMonthlyGoal: false, // Don't auto-create monthly goal here
            });
            return result.data.habitId;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create habit template');
        }
    };

    const createMonthlyGoalFunc = async (goalData: Omit<MonthlyGoal, 'monthlyGoalId' | 'userId'>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const result = await firebaseFunctions.createMonthlyGoal({
                habitId: goalData.habitId,
                month: goalData.month,
                ui: goalData.ui,
                goal: goalData.goal,
                logging: goalData.logging,
                constraints: goalData.constraints,
            });
            return result.data.goalId;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create monthly goal');
        }
    };

    // Update and delete operations still use direct Firestore writes
    // These could be moved to callable functions in a future iteration
    const updateHabitTemplate = async (habitId: string, updates: Partial<HabitTemplate>) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const templateRef = doc(db, 'users', user.uid, 'habitLibrary', habitId);
            await updateDoc(templateRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update habit template');
        }
    };

    const updateMonthlyGoal = async (goalId: string, updates: Partial<MonthlyGoal>) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const goalRef = doc(db, 'users', user.uid, 'monthlyGoals', goalId);
            await updateDoc(goalRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update monthly goal');
        }
    };

    const deleteHabitTemplate = async (habitId: string) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const templateRef = doc(db, 'users', user.uid, 'habitLibrary', habitId);
            await deleteDoc(templateRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete habit template');
        }
    };

    /**
     * Log a habit entry - uses Firebase Callable Function
     */
    const logHabitEntry = async (entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const result = await firebaseFunctions.logHabitEntry({
                monthlyGoalId: entryData.monthlyGoalId,
                targetDate: entryData.targetDate,
                value: entryData.value,
            });
            return result.data.entryId;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to log habit entry');
        }
    };

    const deleteHabitEntry = async (entryId: string) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const entryRef = doc(db, 'users', user.uid, 'habitEntries', entryId);
            await deleteDoc(entryRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete habit entry');
        }
    };

    return {
        createHabitTemplate,
        createMonthlyGoal: createMonthlyGoalFunc,
        updateHabitTemplate,
        updateMonthlyGoal,
        deleteHabitTemplate,
        logHabitEntry,
        deleteHabitEntry,
    };
}
