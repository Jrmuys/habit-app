// Types mirrored from the main app for Firebase Functions

export type HabitTemplate = {
    habitId: string;
    userId: string;
    name: string;
    description?: string;
    icon?: string;
    allowShowUp?: boolean; // "Just Show Up" feature
    showUpPoints?: number; // Points for "show up" days (default 1)
    basePoints?: number; // Points for full completion (default 100)
    partialPoints?: number; // Points for partial completion (default 25)
    milestones?: HabitMilestone[]; // Milestones associated with this habit
    createdAt: string;
};

export type MonthlyGoal = {
    monthlyGoalId: string;
    userId: string;
    habitId: string;
    month: string;
    ui: UIRule;
    goal: GoalRule;
    logging: LoggingRule;
    constraints: ConstraintRule[];
};

export type HabitEntry = {
    entryId: string;
    monthlyGoalId: string;
    userId: string;
    timestamp: string;
    targetDate: string;
    value: string | number | boolean | 'showUp'; // Added 'showUp' for "just show up" entries
};

export type UIRule = {
    type: "CHECKBOX" | "NUMBER_INPUT" | "TIME_INPUT" | "OPTION_SELECT";
    options?: string[];
};

export type GoalRule = {
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    frequency: number;
    targetValue?: TargetValueCondition;
};

export type TargetValueCondition = {
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BEFORE' | 'AFTER';
    value: string | number | boolean;
};

export type LoggingRule = {
    window: {
        startOffsetHours: number;
        endOffsetHours: number;
    };
    allowNextDayCompletion?: boolean;
};

type BaseConstraint = {
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
};

export type GraceDaysConstraint = BaseConstraint & {
    type: 'GRACE_DAYS';
    allowance: number;
};

export type ValueFrequencyConstraint = BaseConstraint & {
    type: 'VALUE_FREQUENCY';
    frequency: number;
    targetValue: TargetValueCondition;
};

export type ConstraintRule = GraceDaysConstraint | ValueFrequencyConstraint;

// Habit-specific milestone (part of habit configuration)
export type HabitMilestone = {
    name: string;
    pointValue: number;
};

export type UserProfile = {
    uid: string;
    email: string;
    name: string;
    points: number;
    partnerId?: string;
};

export type StreakInfo = {
    currentStreak: number;
    multiplier: number;
    hasShield: boolean;
    shieldActive: boolean;
    lastCompletedDate: string | null;
};

export type Milestone = {
    milestoneId: string;
    userId: string;
    habitId?: string;
    name: string;
    description?: string;
    pointValue: number;
    isCompleted: boolean;
    completedAt?: string;
    createdAt: string;
};

export type Reward = {
    rewardId: string;
    userId: string;
    name: string;
    description?: string;
    cost: number;
    isRedeemed: boolean;
    redeemedAt?: string;
    createdAt: string;
};

export type DashboardState = {
    currentUserProfile: UserProfile;
    partnerProfile: UserProfile | null;
    isSingleUser: boolean;
    todaysHabits: Array<{
        goal: MonthlyGoal;
        template: HabitTemplate | undefined;
        entry: HabitEntry | undefined;
        today: string;
        streak: StreakInfo;
        recentHistory: boolean[];
    }>;
    yesterdayHabits: Array<{
        goal: MonthlyGoal;
        template: HabitTemplate | undefined;
        entries: HabitEntry[];
        isCompleted: boolean;
        canCompleteToday: boolean;
        yesterdayDate: string;
        streak: StreakInfo;
    }>;
    weeklyData: Array<{
        user: string;
        days: boolean[];
        userIndex: number;
    }>;
    milestones: Milestone[];
};
