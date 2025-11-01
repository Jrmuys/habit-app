'use client'

import { useAuth } from '@/hooks/useAuth';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HabitTemplate, MonthlyGoal, HabitEntry } from '@/types';
import { logHabitEntryViaFunction } from '@/lib/dashboardFunctions';

/**
 * Simplified useHabits hook - only provides write functions
 * Data fetching is now handled by server-side functions
 */
export function useHabitsSimplified() {
    const { user } = useAuth();

    // The following actions are only for the current user
    const createHabitTemplate = async (templateData: Omit<HabitTemplate, 'habitId' | 'userId' | 'createdAt'>) => {
        if (!user) throw new Error('User not authenticated');

        const newTemplate: Omit<HabitTemplate, 'habitId'> = {
            ...templateData,
            userId: user.uid,
            createdAt: new Date().toISOString(),
        };

        try {
            const docRef = await addDoc(collection(db, 'habits'), newTemplate);
            return docRef.id;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create habit template');
        }
    };

    const createMonthlyGoal = async (goalData: Omit<MonthlyGoal, 'monthlyGoalId' | 'userId'>) => {
        if (!user) throw new Error('User not authenticated');

        const newGoal: Omit<MonthlyGoal, 'monthlyGoalId'> = {
            ...goalData,
            userId: user.uid,
        };

        try {
            const docRef = await addDoc(collection(db, 'monthlyGoals'), newGoal);
            return docRef.id;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create monthly goal');
        }
    };

    const updateHabitTemplate = async (habitId: string, updates: Partial<HabitTemplate>) => {
        try {
            const templateRef = doc(db, 'habits', habitId);
            await updateDoc(templateRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update habit template');
        }
    };

    const updateMonthlyGoal = async (goalId: string, updates: Partial<MonthlyGoal>) => {
        try {
            const goalRef = doc(db, 'monthlyGoals', goalId);
            await updateDoc(goalRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update monthly goal');
        }
    };

    const deleteHabitTemplate = async (habitId: string) => {
        try {
            const templateRef = doc(db, 'habits', habitId);
            await deleteDoc(templateRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete habit template');
        }
    };

    /**
     * Log a habit entry - now calls Firebase Function instead of direct Firestore write
     */
    const logHabitEntry = async (entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const result = await logHabitEntryViaFunction(entryData);
            return result.entryId;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to log habit entry');
        }
    };

    const deleteHabitEntry = async (entryId: string) => {
        try {
            const entryRef = doc(db, 'habitEntries', entryId);
            await deleteDoc(entryRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete habit entry');
        }
    };

    return {
        createHabitTemplate,
        createMonthlyGoal,
        updateHabitTemplate,
        updateMonthlyGoal,
        deleteHabitTemplate,
        logHabitEntry,
        deleteHabitEntry,
    };
}
