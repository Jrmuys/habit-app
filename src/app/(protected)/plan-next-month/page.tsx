'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    XCircle,
    Edit3,
    Plus,
    Calendar,
    Target,
    Hash,
    BarChart3,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type PlanAction = 'continue' | 'modify' | 'drop';
type HabitPlan = {
    habitId: string;
    action: PlanAction;
    goal?: {
        frequency: number;
        targetValue: {
            operator: string;
            value: number;
        };
    };
};

// Step 1: Review Last Month Component
function ReviewLastMonthStep({
    currentMonthHabits,
    habitTemplates,
    habitEntries,
    onNext,
}: {
    currentMonthHabits: any[];
    habitTemplates: any[];
    habitEntries: any[];
    onNext: () => void;
}) {
    const getHabitStats = (habit: any) => {
        const entries = habitEntries.filter(
            (entry) => entry.monthlyGoalId === habit.monthlyGoalId
        );
        const targetSessions = habit.goal?.frequency || 0;
        const completedSessions = entries.length;
        const completionRate =
            targetSessions > 0
                ? Math.round((completedSessions / targetSessions) * 100)
                : 0;

        return {
            completed: completedSessions,
            target: targetSessions,
            rate: completionRate,
        };
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                    Review This Month
                </h2>
                <p className="text-slate-400">
                    Here's how you performed with your habits this month
                </p>
            </div>

            {currentMonthHabits.length === 0 ? (
                <div className="bg-slate-800 rounded-lg p-8 text-center">
                    <Calendar
                        className="mx-auto text-slate-400 mb-4"
                        size={48}
                    />
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                        No Habits This Month
                    </h3>
                    <p className="text-slate-400">
                        You didn't have any active habits this month.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {currentMonthHabits.map((habit) => {
                        const template = habitTemplates.find(
                            (t) => t.habitId === habit.habitId
                        );
                        const stats = getHabitStats(habit);

                        return (
                            <div
                                key={habit.monthlyGoalId}
                                className="bg-slate-800 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-100">
                                            {template?.name || 'Unknown Habit'}
                                        </h3>
                                        <p className="text-sm text-slate-400 mb-2">
                                            {template?.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <BarChart3 size={14} />
                                                <span>
                                                    Completed {stats.completed}{' '}
                                                    out of {stats.target}{' '}
                                                    sessions
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className={`text-2xl font-bold ${
                                                stats.rate >= 80
                                                    ? 'text-emerald-500'
                                                    : stats.rate >= 60
                                                    ? 'text-orange-500'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            {stats.rate}%
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            completion
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <button
                onClick={onNext}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
                Start Planning Next Month
                <ArrowRight size={20} />
            </button>
        </div>
    );
}

// Step 2: Decide for Next Month Component
function DecideForNextMonthStep({
    currentMonthHabits,
    habitTemplates,
    habitPlans,
    onUpdatePlan,
    onNext,
    onPrevious,
}: {
    currentMonthHabits: any[];
    habitTemplates: any[];
    habitPlans: HabitPlan[];
    onUpdatePlan: (habitId: string, plan: HabitPlan) => void;
    onNext: () => void;
    onPrevious: () => void;
}) {
    const [editingHabit, setEditingHabit] = useState<string | null>(null);
    const [editFrequency, setEditFrequency] = useState(3);
    const [editTargetValue, setEditTargetValue] = useState(1);

    const handleActionSelect = (habitId: string, action: PlanAction) => {
        const currentHabit = currentMonthHabits.find(
            (h) => h.habitId === habitId
        );

        if (action === 'modify') {
            setEditingHabit(habitId);
            setEditFrequency(currentHabit?.goal?.frequency || 3);
            setEditTargetValue(currentHabit?.goal?.targetValue?.value || 1);
        } else {
            onUpdatePlan(habitId, {
                habitId,
                action,
                goal: action === 'continue' ? currentHabit?.goal : undefined,
            });
        }
    };

    const handleSaveEdit = () => {
        if (!editingHabit) return;

        onUpdatePlan(editingHabit, {
            habitId: editingHabit,
            action: 'modify',
            goal: {
                frequency: editFrequency,
                targetValue: {
                    operator: 'GREATER_THAN',
                    value: editTargetValue,
                },
            },
        });

        setEditingHabit(null);
    };

    const allDecisionsMade = currentMonthHabits.every((habit) =>
        habitPlans.some((plan) => plan.habitId === habit.habitId)
    );

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                    Decide for Next Month
                </h2>
                <p className="text-slate-400">
                    Choose what to do with each habit for next month
                </p>
            </div>

            <div className="space-y-4">
                {currentMonthHabits.map((habit) => {
                    const template = habitTemplates.find(
                        (t) => t.habitId === habit.habitId
                    );
                    const plan = habitPlans.find(
                        (p) => p.habitId === habit.habitId
                    );
                    const isEditing = editingHabit === habit.habitId;

                    return (
                        <div
                            key={habit.monthlyGoalId}
                            className="bg-slate-800 rounded-lg p-4"
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-slate-100">
                                    {template?.name || 'Unknown Habit'}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Current: {habit.goal?.frequency || 0}x per
                                    week, {habit.goal?.targetValue?.value || 0}{' '}
                                    units
                                </p>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4 bg-slate-700 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Weekly Frequency
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={editFrequency}
                                                onChange={(e) =>
                                                    setEditFrequency(
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Target Value
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editTargetValue}
                                                onChange={(e) =>
                                                    setEditTargetValue(
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setEditingHabit(null)
                                            }
                                            className="flex-1 px-4 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleActionSelect(
                                                habit.habitId,
                                                'continue'
                                            )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            plan?.action === 'continue'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        <CheckCircle size={16} />
                                        Continue
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleActionSelect(
                                                habit.habitId,
                                                'modify'
                                            )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            plan?.action === 'modify'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        <Edit3 size={16} />
                                        Modify
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleActionSelect(
                                                habit.habitId,
                                                'drop'
                                            )
                                        }
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            plan?.action === 'drop'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        <XCircle size={16} />
                                        Drop
                                    </button>
                                </div>
                            )}

                            {plan && !isEditing && (
                                <div className="mt-2 text-sm text-slate-400">
                                    {plan.action === 'continue' &&
                                        'Will continue with same settings'}
                                    {plan.action === 'modify' &&
                                        `Will continue with ${plan.goal?.frequency}x per week, ${plan.goal?.targetValue?.value} units`}
                                    {plan.action === 'drop' &&
                                        'Will not continue next month'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onPrevious}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={!allDecisionsMade}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    Next: Add New Habits
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

// Main Component
export default function PlanNextMonthPage() {
    const { currentUserProfile } = useProfile();
    const { habitTemplates, monthlyGoals, habitEntries } = useHabits();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const [habitPlans, setHabitPlans] = useState<HabitPlan[]>([]);
    const [newHabits, setNewHabits] = useState<HabitPlan[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Get current month's habits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthHabits = monthlyGoals.filter(
        (goal) =>
            goal.userId === currentUserProfile?.uid &&
            goal.month === currentMonth
    );

    // Get current month's entries for stats
    const currentMonthEntries = habitEntries.filter(
        (entry) =>
            entry.userId === currentUserProfile?.uid &&
            entry.targetDate.startsWith(currentMonth)
    );

    const updateHabitPlan = (habitId: string, plan: HabitPlan) => {
        setHabitPlans((prev) => {
            const filtered = prev.filter((p) => p.habitId !== habitId);
            return [...filtered, plan];
        });
    };

    const createNextMonthPlan = async () => {
        if (!currentUserProfile) return;

        setIsCreating(true);
        try {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const nextMonthStr = nextMonth.toISOString().slice(0, 7);

            // Create monthly goals for continued/modified habits
            const continuedPlans = habitPlans.filter(
                (plan) => plan.action !== 'drop'
            );

            for (const plan of continuedPlans) {
                const originalHabit = currentMonthHabits.find(
                    (h) => h.habitId === plan.habitId
                );
                if (!originalHabit) continue;

                await addDoc(collection(db, 'monthlyGoals'), {
                    userId: currentUserProfile.uid,
                    habitId: plan.habitId,
                    month: nextMonthStr,
                    ui: originalHabit.ui,
                    goal: plan.goal || originalHabit.goal,
                    logging: originalHabit.logging,
                    constraints: originalHabit.constraints || [],
                });
            }

            // Create monthly goals for new habits
            for (const newHabit of newHabits) {
                await addDoc(collection(db, 'monthlyGoals'), {
                    userId: currentUserProfile.uid,
                    habitId: newHabit.habitId,
                    month: nextMonthStr,
                    ui: { type: 'CHECKBOX' },
                    goal: newHabit.goal || {
                        period: 'WEEKLY',
                        frequency: 3,
                        targetValue: {
                            operator: 'GREATER_THAN',
                            value: 1,
                        },
                    },
                    logging: {
                        window: {
                            startOffsetHours: 0,
                            endOffsetHours: 24,
                        },
                    },
                    constraints: [],
                });
            }

            // Navigate back to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error creating next month plan:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 pb-20">
            {/* Header */}
            <header className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold text-slate-100">
                        Plan Next Month
                    </h1>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 px-2">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step <= currentStep
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-slate-700 text-slate-400'
                                }`}
                            >
                                {step}
                            </div>
                            {step < 4 && (
                                <div
                                    className={`w-8 h-0.5 ${
                                        step < currentStep
                                            ? 'bg-cyan-600'
                                            : 'bg-slate-700'
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </header>

            <main className="p-4">
                {currentStep === 1 && (
                    <ReviewLastMonthStep
                        currentMonthHabits={currentMonthHabits}
                        habitTemplates={habitTemplates}
                        habitEntries={currentMonthEntries}
                        onNext={() => setCurrentStep(2)}
                    />
                )}

                {currentStep === 2 && (
                    <DecideForNextMonthStep
                        currentMonthHabits={currentMonthHabits}
                        habitTemplates={habitTemplates}
                        habitPlans={habitPlans}
                        onUpdatePlan={updateHabitPlan}
                        onNext={() => setCurrentStep(3)}
                        onPrevious={() => setCurrentStep(1)}
                    />
                )}

                {/* We'll add steps 3 and 4 next */}
            </main>
        </div>
    );
}
