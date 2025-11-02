export type Reward = {
    rewardId: string;
    userId: string;
    name: string;
    cost: number;
    createdAt: string; // ISO 8601 timestamp
};

export type MilestoneSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type Milestone = {
    milestoneId: string;
    userId: string;
    name: string;
    description?: string;
    size: MilestoneSize; // Determines point value: SMALL=150, MEDIUM=500, LARGE=1500
    isCompleted: boolean;
    completedAt?: string; // ISO 8601 timestamp
    createdAt: string; // ISO 8601 timestamp
};

// Helper to get point value from milestone size
export function getMilestonePoints(size: MilestoneSize): number {
    switch (size) {
        case 'SMALL': return 150;
        case 'MEDIUM': return 500;
        case 'LARGE': return 1500;
    }
}

export type ActivityLogEntry = {
    logEntryId: string;
    coupleId: string;
    authorId: string;
    timestamp: string; // ISO 8601 timestamp
    text: string;
};
