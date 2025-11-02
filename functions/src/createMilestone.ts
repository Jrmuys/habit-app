import * as admin from 'firebase-admin';
import { Milestone } from './types';

/**
 * Creates a milestone (one-off goal)
 */
export async function createMilestone(
    userId: string,
    milestoneData: {
        name: string;
        description?: string;
        pointValue: number;
        habitId?: string;
    }
): Promise<string> {
    const db = admin.firestore();

    // Validate input
    if (!milestoneData.name || milestoneData.name.trim().length === 0) {
        throw new Error('Milestone name is required');
    }
    if (!milestoneData.pointValue || milestoneData.pointValue <= 0) {
        throw new Error('Point value must be positive');
    }

    // If habitId is provided, verify it exists and belongs to the user
    if (milestoneData.habitId) {
        const habitDoc = await db.collection('habits').doc(milestoneData.habitId).get();
        if (!habitDoc.exists) {
            throw new Error('Habit not found');
        }
        
        const habitData = habitDoc.data();
        if (habitData?.userId !== userId) {
            throw new Error('Unauthorized: Habit does not belong to user');
        }
    }

    // Create milestone
    const newMilestone: Omit<Milestone, 'milestoneId'> = {
        userId,
        name: milestoneData.name.trim(),
        description: milestoneData.description?.trim(),
        pointValue: milestoneData.pointValue,
        habitId: milestoneData.habitId,
        isCompleted: false,
        createdAt: new Date().toISOString(),
    };

    try {
        // Write to top-level collection (will be migrated to subcollection in Phase 2)
        const milestoneRef = await db.collection('milestones').add(newMilestone);
        return milestoneRef.id;
    } catch (error) {
        console.error('Error creating milestone:', error);
        throw new Error('Failed to create milestone');
    }
}
