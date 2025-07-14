export type UserProfile = {
    uid: string;
    email: string;
    name: string;
    points: number;
    coupleId: string;
    createdAt: string; // ISO 8601 timestamp
};

export function isUserProfile(obj: any): obj is UserProfile {
    return (
        obj &&
        typeof obj.uid === 'string' &&
        typeof obj.email === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.points === 'number' &&
        typeof obj.coupleId === 'string' &&
        typeof obj.createdAt === 'string'
    );
}

export type Couple = {
    coupleId: string;
    members: [string, string];
    createdAt: string; // ISO 8601 timestamp
};

export type ProfileContextType = {
    currentUserProfile: UserProfile | null;
    partnerProfile: UserProfile | null;
    loading: boolean;
};