import * as admin from 'firebase-admin';

/**
 * Marks a milestone as completed and awards points to the user
 */
export async function completeMilestone(
    userId: string,
    milestoneId: string
): Promise<{ success: boolean; pointsAwarded: number }> {
    const db = admin.firestore();

    try {
        // Run in a transaction to ensure consistency
        const result = await db.runTransaction(async (transaction) => {
            // Get milestone from subcollection
            const milestoneRef = db
                .collection('users')
                .doc(userId)
                .collection('milestones')
                .doc(milestoneId);
            const milestoneDoc = await transaction.get(milestoneRef);

            if (!milestoneDoc.exists) {
                throw new Error('Milestone not found');
            }

            const milestoneData = milestoneDoc.data();

            // Check if already completed
            if (milestoneData?.isCompleted) {
                throw new Error('Milestone already completed');
            }

            const pointsAwarded = milestoneData?.pointValue || 0;

            // Mark milestone as completed
            transaction.update(milestoneRef, {
                isCompleted: true,
                completedAt: new Date().toISOString(),
            });

            // Award points to user
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const currentPoints = userDoc.data()?.points || 0;
            transaction.update(userRef, {
                points: currentPoints + pointsAwarded,
            });

            return { pointsAwarded };
        });

        return { success: true, pointsAwarded: result.pointsAwarded };
    } catch (error) {
        console.error('Error completing milestone:', error);
        throw error;
    }
}
