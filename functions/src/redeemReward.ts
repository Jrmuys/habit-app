import * as admin from 'firebase-admin';

/**
 * Redeems a reward by deducting points from the user
 */
export async function redeemReward(
    userId: string,
    rewardId: string
): Promise<{ success: boolean; pointsSpent: number }> {
    const db = admin.firestore();

    try {
        // Run in a transaction to ensure consistency
        const result = await db.runTransaction(async (transaction) => {
            // Get reward from subcollection
            const rewardRef = db
                .collection('users')
                .doc(userId)
                .collection('rewards')
                .doc(rewardId);
            const rewardDoc = await transaction.get(rewardRef);

            if (!rewardDoc.exists) {
                throw new Error('Reward not found');
            }

            const rewardData = rewardDoc.data();

            // Check if already redeemed
            if (rewardData?.isRedeemed) {
                throw new Error('Reward already redeemed');
            }

            const cost = rewardData?.cost || 0;

            // Get user and check points
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const currentPoints = userDoc.data()?.points || 0;
            
            if (currentPoints < cost) {
                throw new Error('Insufficient points');
            }

            // Mark reward as redeemed
            transaction.update(rewardRef, {
                isRedeemed: true,
                redeemedAt: new Date().toISOString(),
            });

            // Deduct points from user
            transaction.update(userRef, {
                points: currentPoints - cost,
            });

            return { pointsSpent: cost };
        });

        return { success: true, pointsSpent: result.pointsSpent };
    } catch (error) {
        console.error('Error redeeming reward:', error);
        throw error;
    }
}
