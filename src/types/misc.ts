export type Reward = {
    rewardId: string;
    userId: string;
    name: string;
    cost: number;
    createdAt: string; // ISO 8601 timestamp
};

export type Milestone = {
    milestoneId: string;
    userId: string;
    habitId?: string; // Optional: links milestone to a specific habit
    name: string;
    description?: string;
    pointValue: number; // Fixed point value (e.g., 150, 500, 1500)
    isCompleted: boolean;
    completedAt?: string; // ISO 8601 timestamp
    createdAt: string; // ISO 8601 timestamp
};

export type ActivityLogEntry = {
    logEntryId: string;
    coupleId: string;
    authorId: string;
    timestamp: string; // ISO 8601 timestamp
    text: string;
};
