import * as admin from 'firebase-admin';

export type Reward = {
    rewardId: string;
    userId: string;
    name: string;
    description?: string;
    cost: number;
    isRedeemed: boolean;
    redeemedAt?: string;
    createdAt: string;
};

/**
 * Creates a reward that can be redeemed with points
 */
export async function createReward(
    userId: string,
    rewardData: {
        name: string;
        description?: string;
        cost: number;
    }
): Promise<string> {
    const db = admin.firestore();

    // Validate input
    if (!rewardData.name || rewardData.name.trim().length === 0) {
        throw new Error('Reward name is required');
    }
    if (!rewardData.cost || rewardData.cost <= 0) {
        throw new Error('Cost must be positive');
    }

    // Create reward
    const newReward: Omit<Reward, 'rewardId'> = {
        userId,
        name: rewardData.name.trim(),
        description: rewardData.description?.trim(),
        cost: rewardData.cost,
        isRedeemed: false,
        createdAt: new Date().toISOString(),
    };

    try {
        // Write to top-level collection (will be migrated to subcollection in Phase 2)
        const rewardRef = await db.collection('rewards').add(newReward);
        return rewardRef.id;
    } catch (error) {
        console.error('Error creating reward:', error);
        throw new Error('Failed to create reward');
    }
}
