'use client'

import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLogEntry } from '@/types/misc';

export function useActivityLog() {
    const { currentUserProfile } = useProfile();
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUserProfile?.coupleId) {
            setActivityLog([]);
            setLoading(false);
            return;
        }

        let activityUnsubscribe: (() => void) | undefined;

        try {
            // Subscribe to couple's activity log
            const activityQuery = query(
                collection(db, 'activityLog'),
                where('coupleId', '==', currentUserProfile.coupleId),
                orderBy('timestamp', 'desc'),
                limit(50) // Limit to recent 50 entries
            );

            activityUnsubscribe = onSnapshot(activityQuery, (snapshot) => {
                const activityData = snapshot.docs.map(doc => ({
                    logEntryId: doc.id,
                    ...doc.data()
                })) as ActivityLogEntry[];
                setActivityLog(activityData);
                setLoading(false);
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }

        return () => {
            activityUnsubscribe?.();
        };
    }, [currentUserProfile?.coupleId]);

    const addActivityEntry = async (text: string) => {
        if (!currentUserProfile?.coupleId) {
            throw new Error('User not in a couple');
        }

        const newEntry: Omit<ActivityLogEntry, 'logEntryId'> = {
            coupleId: currentUserProfile.coupleId,
            authorId: currentUserProfile.uid,
            text,
            timestamp: new Date().toISOString(),
        };

        try {
            const docRef = await addDoc(collection(db, 'activityLog'), newEntry);
            return docRef.id;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to add activity entry');
        }
    };

    const deleteActivityEntry = async (entryId: string) => {
        try {
            const entryRef = doc(db, 'activityLog', entryId);
            await deleteDoc(entryRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete activity entry');
        }
    };

    return {
        activityLog,
        loading,
        error,
        addActivityEntry,
        deleteActivityEntry,
    };
}
