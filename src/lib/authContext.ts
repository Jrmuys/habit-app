'use client'

import { User } from "firebase/auth";
import { createContext } from "react";

export type AuthContextType = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});
