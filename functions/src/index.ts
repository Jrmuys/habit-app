import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getDashboardState } from './getDashboardState';
import { logHabitEntry } from './logHabitEntry';
import { HabitEntry } from './types';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * HTTP Callable Function: Get Dashboard State
 * Returns all the calculated state for the dashboard
 */
export const getDashboardStateCallable = functions.https.onCall(
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;

        try {
            const dashboardState = await getDashboardState(userId);
            return dashboardState;
        } catch (error) {
            console.error('Error getting dashboard state:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to get dashboard state'
            );
        }
    }
);

/**
 * HTTP Callable Function: Log Habit Entry
 * Logs a habit entry for the authenticated user
 */
export const logHabitEntryCallable = functions.https.onCall(
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;
        const data = request.data as Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>;

        try {
            const entryId = await logHabitEntry(userId, data);
            return { entryId, success: true };
        } catch (error) {
            console.error('Error logging habit entry:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to log habit entry'
            );
        }
    }
);
