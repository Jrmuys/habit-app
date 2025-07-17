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

export function isCouple(obj: any): obj is Couple {
    return (
        obj &&
        typeof obj.coupleId === 'string' &&
        Array.isArray(obj.members) &&
        obj.members.length === 2 &&
        typeof obj.members[0] === 'string' &&
        typeof obj.members[1] === 'string' &&
        typeof obj.createdAt === 'string'
    );
}

export type ProfileContextType = {
    currentUserProfile: UserProfile | null;
    partnerProfile: UserProfile | null;
    loading: boolean;
};