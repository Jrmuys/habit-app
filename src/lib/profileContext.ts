import { ProfileContextType } from '@/types';
import { createContext } from 'react';

export const ProfileContext = createContext<ProfileContextType | undefined>(
    undefined
);
