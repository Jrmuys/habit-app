// HabitTemplate represents the basic template stored in 'habits' collection
export type HabitTemplate = {
    habitId: string;
    userId: string;
    name: string;
    description?: string;
    icon?: string;
    allowPartial?: boolean; // "Partial Completion / Just Show Up" feature (combined)
    basePoints?: number; // Points for full completion (default 100)
    // NOTE: partialPoints and showUpPoints are deprecated - partial/showUp always awards 25 points
    partialPoints?: number; // DEPRECATED: kept for backward compatibility
    showUpPoints?: number; // DEPRECATED: kept for backward compatibility
    milestones?: HabitMilestone[]; // Milestones associated with this habit
    createdAt: string; // ISO 8601 timestamp
};

export type MonthlyGoal = {
    monthlyGoalId: string;
    userId: string;
    habitId: string;
    month: string; // YYYY-MM format
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
    options?: string[]; // For "MULTI_CHOICE"
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
    allowNextDayCompletion?: boolean; // For sleep/end-of-day habits
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
