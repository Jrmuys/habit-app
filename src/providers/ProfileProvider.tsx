import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isUserProfile, UserProfile } from '@/types';
import { ProfileContext } from '@/lib/profileContext';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [currentUserProfile, setCurrentUserProfile] =
        useState<UserProfile | null>(null);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let userProfileUnsubscribe: (() => void) | undefined;
        let partnerProfileUnsubscribe: (() => void) | undefined;

        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            userProfileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userProfileData = {
                        uid: docSnap.id,
                        ...docSnap.data(),
                    };
                    if (isUserProfile(userProfileData)) {
                        setCurrentUserProfile(userProfileData);
                        setLoading(false);
                    } else {
                        setCurrentUserProfile(null);
                        setLoading(false);
                    }
                } else {
                    setCurrentUserProfile(null);
                    setLoading(false);
                }
            });
        } else {
            setCurrentUserProfile(null);
            setPartnerProfile(null);
            setLoading(false);
        }

        return () => {
            if (userProfileUnsubscribe) userProfileUnsubscribe();
            if (partnerProfileUnsubscribe) partnerProfileUnsubscribe();
        };
    }, [user]);

    const value = { currentUserProfile, partnerProfile, loading };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}
