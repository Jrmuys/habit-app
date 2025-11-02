import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { UIRule, GoalRule, LoggingRule, ConstraintRule } from '@/types';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Type definitions for function parameters and responses
export type CreateHabitParams = {
    name: string;
    description?: string;
    icon?: string;
    allowShowUp?: boolean;
    showUpPoints?: number;
    createMonthlyGoal?: boolean;
    monthlyGoalConfig?: {
        month?: string;
        ui?: UIRule;
        goal?: GoalRule;
        logging?: LoggingRule;
        constraints?: ConstraintRule[];
    };
};

export type CreateHabitResponse = {
    habitId: string;
    monthlyGoalId?: string;
};

export type CreateMonthlyGoalParams = {
    habitId: string;
    month: string;
    ui: UIRule;
    goal: GoalRule;
    logging: LoggingRule;
    constraints?: ConstraintRule[];
};

export type CreateMonthlyGoalResponse = {
    goalId: string;
    success: boolean;
};

export type CreateMilestoneParams = {
    name: string;
    description?: string;
    pointValue: number;
    habitId?: string;
};

export type CreateMilestoneResponse = {
    milestoneId: string;
    success: boolean;
};

export type CreateRewardParams = {
    name: string;
    description?: string;
    cost: number;
};

export type CreateRewardResponse = {
    rewardId: string;
    success: boolean;
};

export type CompleteMilestoneParams = {
    milestoneId: string;
};

export type CompleteMilestoneResponse = {
    success: boolean;
    pointsAwarded: number;
};

export type RedeemRewardParams = {
    rewardId: string;
};

export type RedeemRewardResponse = {
    success: boolean;
    pointsSpent: number;
};

export type LogHabitEntryParams = {
    monthlyGoalId: string;
    targetDate: string;
    value: string | number | boolean | 'showUp';
};

export type LogHabitEntryResponse = {
    entryId: string;
    pointsAwarded: number;
    success: boolean;
};

// Callable functions
export const createHabit = httpsCallable<CreateHabitParams, CreateHabitResponse>(
    functions,
    'createHabitCallable'
);

export const createMonthlyGoal = httpsCallable<CreateMonthlyGoalParams, CreateMonthlyGoalResponse>(
    functions,
    'createMonthlyGoalCallable'
);

export const createMilestone = httpsCallable<CreateMilestoneParams, CreateMilestoneResponse>(
    functions,
    'createMilestoneCallable'
);

export const createReward = httpsCallable<CreateRewardParams, CreateRewardResponse>(
    functions,
    'createRewardCallable'
);

export const completeMilestone = httpsCallable<CompleteMilestoneParams, CompleteMilestoneResponse>(
    functions,
    'completeMilestoneCallable'
);

export const redeemReward = httpsCallable<RedeemRewardParams, RedeemRewardResponse>(
    functions,
    'redeemRewardCallable'
);

export const logHabitEntry = httpsCallable<LogHabitEntryParams, LogHabitEntryResponse>(
    functions,
    'logHabitEntryCallable'
);

export const getDashboardState = httpsCallable(
    functions,
    'getDashboardStateCallable'
);
