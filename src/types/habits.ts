export type HabitTemplate = {
    habitId: string;
    userId: string;
    name: string;
    description?: string;
    icon?: string;
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
    value: string | number | boolean;
};

export type UIRule = {
    type: 'CHECKBOX' | 'COUNTER' | 'TIME_PICKER' | 'MULTI_CHOICE';
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
