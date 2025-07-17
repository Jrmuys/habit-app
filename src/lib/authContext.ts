'use client'

import { User } from "firebase/auth";
import { createContext } from "react";

export const AuthContext = createContext<{ user: User | null; loading: boolean }>({
    user: null,
    loading: true,
});
