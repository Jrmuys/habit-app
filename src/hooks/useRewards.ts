'use client'

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reward } from '@/types/misc';

export function useRewards() {
    const { user } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false); // Start with false since ProtectedLayout handles auth loading
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
            // Subscribe to user's rewards from subcollection
            const rewardsQuery = query(
                collection(db, 'users', user.uid, 'rewards')
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

        try {
            // Use Firebase Callable Function to create reward
            const { createReward: createRewardFunc } = await import('@/lib/firebaseFunctions');
            const result = await createRewardFunc({
                name: rewardData.name,
                description: rewardData.description,
                cost: rewardData.cost,
            });
            return result.data.rewardId;
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to create reward');
        }
    };

    const updateReward = async (rewardId: string, updates: Partial<Reward>) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const rewardRef = doc(db, 'users', user.uid, 'rewards', rewardId);
            await updateDoc(rewardRef, updates);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to update reward');
        }
    };

    const deleteReward = async (rewardId: string) => {
        if (!user) throw new Error('User not authenticated');
        
        try {
            const rewardRef = doc(db, 'users', user.uid, 'rewards', rewardId);
            await deleteDoc(rewardRef);
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Failed to delete reward');
        }
    };

    const purchaseReward = async (rewardId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Use Firebase Callable Function to redeem reward
            const { redeemReward } = await import('@/lib/firebaseFunctions');
            await redeemReward({ rewardId });
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
