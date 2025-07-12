export type User = {
    uid: string;
    email: string;
    name: string;
    points: number;
    coupleId: string;
    createdAt: string; // ISO 8601 timestamp
};

export type Couple = {
    coupleId: string;
    members: [string, string];
    createdAt: string; // ISO 8601 timestamp
};