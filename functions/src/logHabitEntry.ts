import * as admin from 'firebase-admin';
import { HabitEntry } from './types';

/**
 * Logs a habit entry to Firestore
 */
export async function logHabitEntry(
    userId: string,
    entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>
): Promise<string> {
    const db = admin.firestore();

    const newEntry: Omit<HabitEntry, 'entryId'> = {
        ...entryData,
        userId,
        timestamp: new Date().toISOString(),
    };

    // Write to subcollection under users/{userId}/habitEntries
    const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('habitEntries')
        .add(newEntry);
    return docRef.id;
}
