'use client'

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reward } from '@/types/misc';

export function useRewards() {
    const { user } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setRewards([]);
            setLoading(false);
            return;
        }

        // Reset error state when starting fresh
        setError(null);
        setLoading(true);

        let rewardsUnsubscribe: (() => void) | undefined;

        try {
            // Subscribe to user's rewards
            const rewardsQuery = query(
                collection(db, 'rewards'),
                where('userId', '==', user.uid)
            );

            rewardsUnsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
                const rewardsData = snapshot.docs.map(doc => ({
                    rewardId: doc.id,
                    ...doc.data()
                })) as Reward[];
                setRewards(rewardsData);
                setLoading(false);
            }, (error) => {
                console.error('Error fetching rewards:', error);
                setError(error instanceof Error ? error.message : 'An error occurred');
                setLoading(false);
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }

        return () => {
            rewardsUnsubscribe?.();
        };
    }, [user?.uid]); // Only depend on user.uid, not the entire user object

    const createReward = async (rewardData: Omit<Reward, 'rewardId' | 'userId' | 'createdAt'>) => {
        if (!user) throw new Error('User not authenticated');

        const newReward: Omit<Reward, 'rewardId'> = {
            ...rewardData,
            userId: user.uid,
            createdAt: new Date().toISOString(),
        };

        try {
            const docRef = await addDoc(collection(db, 'rewards'), newReward);
            return docRef.id;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create reward');
        }
    };

    const updateReward = async (rewardId: string, updates: Partial<Reward>) => {
        try {
            const rewardRef = doc(db, 'rewards', rewardId);
            await updateDoc(rewardRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update reward');
        }
    };

    const deleteReward = async (rewardId: string) => {
        try {
            const rewardRef = doc(db, 'rewards', rewardId);
            await deleteDoc(rewardRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete reward');
        }
    };

    const purchaseReward = async (rewardId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            await runTransaction(db, async (transaction) => {
                // Get the reward details
                const rewardRef = doc(db, 'rewards', rewardId);
                const rewardDoc = await transaction.get(rewardRef);

                if (!rewardDoc.exists()) {
                    throw new Error('Reward not found');
                }

                const reward = { rewardId: rewardDoc.id, ...rewardDoc.data() } as Reward;

                // Get the user's profile
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User profile not found');
                }

                const userProfile = userDoc.data();
                const currentPoints = userProfile.points || 0;

                // Check if user has enough points
                if (currentPoints < reward.cost) {
                    throw new Error('Insufficient points');
                }

                // Deduct points from user's profile
                transaction.update(userRef, {
                    points: currentPoints - reward.cost
                });

                // Create activity log entry
                const activityLogRef = collection(db, 'activityLog');
                transaction.set(doc(activityLogRef), {
                    coupleId: userProfile.coupleId || '',
                    authorId: user.uid,
                    timestamp: new Date().toISOString(),
                    text: `Redeemed "${reward.name}" for ${reward.cost} points`
                });
            });

            console.log(`Successfully redeemed reward: ${rewardId}`);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to redeem reward');
        }
    };

    return {
        rewards,
        loading,
        error,
        createReward,
        updateReward,
        deleteReward,
        purchaseReward,
    };
}
