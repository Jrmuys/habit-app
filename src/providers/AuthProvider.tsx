'use client';

import { AuthContext } from '@/lib/authContext';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Don't set up auth listener during build time
        if (typeof window === 'undefined' || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setUser(null);
                setLoading(false);
                return;
            }
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        if (auth) {
            await signOut(auth);
        }
    };

    const value = { user, loading, logout };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
