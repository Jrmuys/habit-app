import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getDashboardState } from './getDashboardState';
import { logHabitEntry } from './logHabitEntry';
import { createHabit } from './createHabit';
import { createMonthlyGoal } from './createMonthlyGoal';
import { createMilestone } from './createMilestone';
import { createReward } from './createReward';
import { completeMilestone } from './completeMilestone';
import { redeemReward } from './redeemReward';
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

/**
 * HTTP Callable Function: Create Habit
 * Creates a new habit template and optionally a monthly goal
 */
export const createHabitCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;

        try {
            const result = await createHabit(userId, request.data);
            return result;
        } catch (error) {
            console.error('Error creating habit:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to create habit'
            );
        }
    }
);

/**
 * HTTP Callable Function: Create Monthly Goal
 * Creates a monthly goal for an existing habit
 */
export const createMonthlyGoalCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;

        try {
            const goalId = await createMonthlyGoal(userId, request.data);
            return { goalId, success: true };
        } catch (error) {
            console.error('Error creating monthly goal:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to create monthly goal'
            );
        }
    }
);

/**
 * HTTP Callable Function: Create Milestone
 * Creates a new milestone
 */
export const createMilestoneCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;

        try {
            const milestoneId = await createMilestone(userId, request.data);
            return { milestoneId, success: true };
        } catch (error) {
            console.error('Error creating milestone:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to create milestone'
            );
        }
    }
);

/**
 * HTTP Callable Function: Create Reward
 * Creates a new reward
 */
export const createRewardCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;

        try {
            const rewardId = await createReward(userId, request.data);
            return { rewardId, success: true };
        } catch (error) {
            console.error('Error creating reward:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to create reward'
            );
        }
    }
);

/**
 * HTTP Callable Function: Complete Milestone
 * Marks a milestone as completed and awards points
 */
export const completeMilestoneCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;
        const { milestoneId } = request.data;

        if (!milestoneId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Milestone ID is required'
            );
        }

        try {
            const result = await completeMilestone(userId, milestoneId);
            return result;
        } catch (error) {
            console.error('Error completing milestone:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to complete milestone'
            );
        }
    }
);

/**
 * HTTP Callable Function: Redeem Reward
 * Redeems a reward by deducting points from the user
 */
export const redeemRewardCallable = functions.https.onCall(
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = request.auth.uid;
        const { rewardId } = request.data;

        if (!rewardId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Reward ID is required'
            );
        }

        try {
            const result = await redeemReward(userId, rewardId);
            return result;
        } catch (error) {
            console.error('Error redeeming reward:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Failed to redeem reward'
            );
        }
    }
);
