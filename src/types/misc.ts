export type Reward = {
    rewardId: string;
    userId: string;
    name: string;
    cost: number;
    createdAt: string; // ISO 8601 timestamp
};

export type ActivityLogEntry = {
    logEntryId: string;
    coupleId: string;
    authorId: string;
    timestamp: string; // ISO 8601 timestamp
    text: string;
};
