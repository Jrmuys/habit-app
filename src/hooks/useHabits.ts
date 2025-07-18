'use client'

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HabitTemplate, MonthlyGoal, HabitEntry } from '@/types';

export function useHabits() {
    const { user } = useAuth();
    const [habitTemplates, setHabitTemplates] = useState<HabitTemplate[]>([]);
    const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
    const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
    const [loading, setLoading] = useState(false); // Start with false since ProtectedLayout handles auth loading
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setHabitTemplates([]);
            setMonthlyGoals([]);
            setHabitEntries([]);
            setLoading(false);
            return;
        }

        let templatesUnsubscribe: (() => void) | undefined;
        let goalsUnsubscribe: (() => void) | undefined;
        let entriesUnsubscribe: (() => void) | undefined;

        try {
            // Subscribe to user's habit templates
            const templatesQuery = query(
                collection(db, 'habits'),
                where('userId', '==', user.uid)
            );

            templatesUnsubscribe = onSnapshot(templatesQuery, (snapshot) => {
                const templatesData = snapshot.docs.map(doc => ({
                    habitId: doc.id,
                    ...doc.data()
                })) as HabitTemplate[];
                setHabitTemplates(templatesData);
                setLoading(false);
            });

            // Subscribe to user's monthly goals
            const goalsQuery = query(
                collection(db, 'monthlyGoals'),
                where('userId', '==', user.uid)
            );

            goalsUnsubscribe = onSnapshot(goalsQuery, (snapshot) => {
                const goalsData = snapshot.docs.map(doc => ({
                    monthlyGoalId: doc.id,
                    ...doc.data()
                })) as MonthlyGoal[];
                setMonthlyGoals(goalsData);
            });

            // Subscribe to user's habit entries
            const entriesQuery = query(
                collection(db, 'habitEntries'),
                where('userId', '==', user.uid)
            );

            entriesUnsubscribe = onSnapshot(entriesQuery, (snapshot) => {
                const entriesData = snapshot.docs.map(doc => ({
                    entryId: doc.id,
                    ...doc.data()
                })) as HabitEntry[];
                setHabitEntries(entriesData);
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }

        return () => {
            templatesUnsubscribe?.();
            goalsUnsubscribe?.();
            entriesUnsubscribe?.();
        };
    }, [user?.uid]); // Only depend on user.uid, not the entire user object

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

    const logHabitEntry = async (entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>) => {
        if (!user) throw new Error('User not authenticated');

        const newEntry: Omit<HabitEntry, 'entryId'> = {
            ...entryData,
            userId: user.uid,
            timestamp: new Date().toISOString(),
        };

        try {
            const docRef = await addDoc(collection(db, 'habitEntries'), newEntry);
            return docRef.id;
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
        habitTemplates,
        monthlyGoals,
        habitEntries,
        loading,
        error,
        createHabitTemplate,
        createMonthlyGoal,
        updateHabitTemplate,
        updateMonthlyGoal,
        deleteHabitTemplate,
        logHabitEntry,
        deleteHabitEntry,
    };
}
