'use client'

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }

        return () => {
            rewardsUnsubscribe?.();
        };
    }, [user]);

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
        // This would typically involve:
        // 1. Check if user has enough points
        // 2. Deduct points from user's profile
        // 3. Log the purchase/redemption
        // For now, we'll just log it
        console.log(`Purchasing reward: ${rewardId}`);
        // Implementation would depend on your business logic
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
