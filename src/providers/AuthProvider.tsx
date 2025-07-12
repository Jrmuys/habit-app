'use client';

import { AuthContext } from '@/lib/authContext';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
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

   const value = { user, loading };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
