'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isCouple, isUserProfile, UserProfile } from '@/types';
import { ProfileContext } from '@/lib/profileContext';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [currentUserProfile, setCurrentUserProfile] =
        useState<UserProfile | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [isSingleUser, setIsSingleUser] = useState(false);

    // Helper function to handle user profile updates
    const handleUserProfile = (
        docSnap: any,
        subscribeToCoupleCallback: (coupleId: string) => void
    ) => {
        if (!docSnap.exists()) {
            // Create a new user profile for first-time users
            createUserProfile();
            return;
        }

        const userProfileData = {
            uid: docSnap.id,
            ...docSnap.data(),
        };
        console.log('User profile data:', userProfileData);
        if (isUserProfile(userProfileData)) {
            setCurrentUserProfile(userProfileData);
            setLoading(false);

            // Subscribe to couple data if user has a coupleId
            if (userProfileData.coupleId) {
                subscribeToCoupleCallback(userProfileData.coupleId);
            } else {
                setPartnerProfile(null);
                setIsSingleUser(true);
            }
        } else {
            setCurrentUserProfile(null);
            setLoading(false);
        }
    };

    // Helper function to create a new user profile
    const createUserProfile = async () => {
        if (!user) return;

        try {
            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                name: user.displayName || user.email?.split('@')[0] || 'User',
                points: 0,
                coupleId: '',
                createdAt: new Date().toISOString(),
            };

            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, newUserProfile);

            console.log('Created new user profile:', newUserProfile);
            setCurrentUserProfile(newUserProfile);
            setLoading(false);
        } catch (error) {
            console.error('Error creating user profile:', error);
            setLoading(false);
        }
    };

    // Helper function to handle partner profile updates
    const handlePartnerProfile = (partnerDocSnap: any) => {
        if (!partnerDocSnap.exists()) {
            setPartnerProfile(null);
            return;
        }

        const partnerProfileData = {
            uid: partnerDocSnap.id,
            ...partnerDocSnap.data(),
        };

        if (isUserProfile(partnerProfileData)) {
            setPartnerProfile(partnerProfileData);
        } else {
            setPartnerProfile(null);
        }
    };

    // Helper function to handle couple data
    const handleCoupleData = (coupleDocSnap: any) => {
        if (!coupleDocSnap.exists()) {
            setPartnerProfile(null);
            setIsSingleUser(true);
            return null;
        }

        const coupleData = {
            uid: coupleDocSnap.id,
            ...coupleDocSnap.data(),
        };

        if (!isCouple(coupleData) || !user) {
            setPartnerProfile(null);
            setIsSingleUser(true);
            return null;
        }

        const partnerUid = coupleData.members.find((uid) => uid !== user.uid);
        if (!partnerUid) {
            setPartnerProfile(null);
            setIsSingleUser(true);
            return null;
        }

        // Subscribe to partner's profile
        const partnerDocRef = doc(db, 'users', partnerUid);
        return onSnapshot(partnerDocRef, handlePartnerProfile);
    };

    useEffect(() => {
        let userProfileUnsubscribe: (() => void) | undefined;
        let coupleUnsubscribe: (() => void) | undefined;
        let partnerProfileUnsubscribe: (() => void) | undefined;

        if (!user) {
            setCurrentUserProfile(null);
            setPartnerProfile(null);
            setLoading(false);
            setIsSingleUser(true);
            return;
        }

        // Helper function to subscribe to couple data
        const subscribeToCoupleData = (coupleId: string) => {
            // Clean up previous couple subscription
            if (coupleUnsubscribe) {
                coupleUnsubscribe();
                coupleUnsubscribe = undefined;
            }

            // Clean up previous partner subscription
            if (partnerProfileUnsubscribe) {
                partnerProfileUnsubscribe();
                partnerProfileUnsubscribe = undefined;
            }

            const coupleDocRef = doc(db, 'couples', coupleId);
            coupleUnsubscribe = onSnapshot(coupleDocRef, (coupleDocSnap) => {
                // Clean up previous partner subscription
                if (partnerProfileUnsubscribe) {
                    partnerProfileUnsubscribe();
                    partnerProfileUnsubscribe = undefined;
                }

                // Set up new partner subscription
                const newPartnerUnsub = handleCoupleData(coupleDocSnap);
                partnerProfileUnsubscribe = newPartnerUnsub || undefined;
            });
        };

        // Subscribe to user profile
        const userDocRef = doc(db, 'users', user.uid);
        userProfileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            handleUserProfile(docSnap, subscribeToCoupleData);
        });

        return () => {
            userProfileUnsubscribe?.();
            coupleUnsubscribe?.();
            partnerProfileUnsubscribe?.();
        };
    }, [user]);

    // Function to refresh profiles manually
    const refreshProfiles = async () => {
        if (!user) return;

        setLoading(true);
        // The real-time listeners will automatically update the profiles
        // We just need to trigger a re-render by setting loading state
        setTimeout(() => setLoading(false), 100);
    };

    const value = {
        currentUserProfile,
        partnerProfile,
        loading,
        isSingleUser,
        refreshProfiles,
    };
    console.log('ProfileProvider value:', value);

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}
