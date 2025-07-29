'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Edit3,
    Save,
    X,
    Target,
    Calendar,
    Hash,
    Clock,
    Plus,
} from 'lucide-react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Edit Modal Component
function EditHabitModal({
    isOpen,
    onClose,
    habit,
    template,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    habit: any;
    template: any;
    onSave: (updatedHabit: any) => void;
}) {
    const [frequency, setFrequency] = useState(habit?.goal?.frequency || 3);
    const [targetValue, setTargetValue] = useState(
        habit?.goal?.targetValue?.value || 1
    );
    const [allowNextDayCompletion, setAllowNextDayCompletion] = useState(
        habit?.logging?.allowNextDayCompletion || false
    );

    // Additional UI and goal configuration
    const [uiType, setUiType] = useState(habit?.ui?.type || 'CHECKBOX');
    const [uiOptions, setUiOptions] = useState(
        habit?.ui?.options?.join(', ') || ''
    );
    const [period, setPeriod] = useState(habit?.goal?.period || 'WEEKLY');
    const [targetOperator, setTargetOperator] = useState(
        habit?.goal?.targetValue?.operator || 'GREATER_THAN'
    );
    const [hasTargetValue, setHasTargetValue] = useState(
        Boolean(habit?.goal?.targetValue)
    );

    // Constraints
    const [hasGraceDays, setHasGraceDays] = useState(
        Boolean(habit?.constraints?.find((c: any) => c.type === 'GRACE_DAYS'))
    );
    const [graceDays, setGraceDays] = useState(
        habit?.constraints?.find((c: any) => c.type === 'GRACE_DAYS')
            ?.allowance || 0
    );
    const [gracePeriod, setGracePeriod] = useState(
        habit?.constraints?.find((c: any) => c.type === 'GRACE_DAYS')?.period ||
            'WEEKLY'
    );

    const [hasValueConstraint, setHasValueConstraint] = useState(
        Boolean(
            habit?.constraints?.find((c: any) => c.type === 'VALUE_FREQUENCY')
        )
    );
    const [valueConstraintFreq, setValueConstraintFreq] = useState(
        habit?.constraints?.find((c: any) => c.type === 'VALUE_FREQUENCY')
            ?.frequency || 3
    );
    const [valueConstraintPeriod, setValueConstraintPeriod] = useState(
        habit?.constraints?.find((c: any) => c.type === 'VALUE_FREQUENCY')
            ?.period || 'WEEKLY'
    );
    const [valueConstraintOperator, setValueConstraintOperator] = useState(
        habit?.constraints?.find((c: any) => c.type === 'VALUE_FREQUENCY')
            ?.targetValue?.operator || 'GREATER_THAN'
    );
    const [valueConstraintValue, setValueConstraintValue] = useState(
        habit?.constraints?.find((c: any) => c.type === 'VALUE_FREQUENCY')
            ?.targetValue?.value || ''
    );

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (habit) {
            setFrequency(habit.goal?.frequency || 3);
            setTargetValue(habit.goal?.targetValue?.value || 1);
            setAllowNextDayCompletion(
                habit.logging?.allowNextDayCompletion || false
            );
            setUiType(habit.ui?.type || 'CHECKBOX');
            setUiOptions(habit.ui?.options?.join(', ') || '');
            setPeriod(habit.goal?.period || 'WEEKLY');
            setTargetOperator(
                habit.goal?.targetValue?.operator || 'GREATER_THAN'
            );
            setHasTargetValue(Boolean(habit.goal?.targetValue));

            // Initialize constraints
            const graceDaysConstraint = habit.constraints?.find(
                (c: any) => c.type === 'GRACE_DAYS'
            );
            const valueFreqConstraint = habit.constraints?.find(
                (c: any) => c.type === 'VALUE_FREQUENCY'
            );

            setHasGraceDays(Boolean(graceDaysConstraint));
            setGraceDays(graceDaysConstraint?.allowance || 0);
            setGracePeriod(graceDaysConstraint?.period || 'WEEKLY');

            setHasValueConstraint(Boolean(valueFreqConstraint));
            setValueConstraintFreq(valueFreqConstraint?.frequency || 3);
            setValueConstraintPeriod(valueFreqConstraint?.period || 'WEEKLY');
            setValueConstraintOperator(
                valueFreqConstraint?.targetValue?.operator || 'GREATER_THAN'
            );
            setValueConstraintValue(
                valueFreqConstraint?.targetValue?.value || ''
            );
        }
    }, [habit]);

    if (!isOpen || !habit || !template) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Build constraints array
            const constraints = [];

            if (hasGraceDays && graceDays > 0) {
                constraints.push({
                    type: 'GRACE_DAYS',
                    period: gracePeriod,
                    allowance: graceDays,
                });
            }

            if (
                hasValueConstraint &&
                valueConstraintFreq > 0 &&
                valueConstraintValue.toString().trim()
            ) {
                constraints.push({
                    type: 'VALUE_FREQUENCY',
                    period: valueConstraintPeriod,
                    frequency: valueConstraintFreq,
                    targetValue: {
                        operator: valueConstraintOperator,
                        value: valueConstraintValue,
                    },
                });
            }

            const updatedHabit = {
                ...habit,
                ui: {
                    type: uiType,
                    ...(uiType === 'OPTION_SELECT' && {
                        options: uiOptions
                            .split(',')
                            .map((opt: string) => opt.trim())
                            .filter(Boolean),
                    }),
                },
                goal: {
                    ...habit.goal,
                    period: period,
                    frequency,
                    ...(hasTargetValue && {
                        targetValue: {
                            operator: targetOperator,
                            value: targetValue,
                        },
                    }),
                },
                logging: {
                    ...habit.logging,
                    allowNextDayCompletion,
                },
                constraints,
            };
            await onSave(updatedHabit);
            onClose();
        } catch (error) {
            console.error('Error saving habit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">
                        Edit Habit
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Habit Name */}
                    <div>
                        <h4 className="text-lg font-medium text-slate-100 mb-2">
                            {template.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                            {template.description}
                        </p>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Frequency
                        </label>
                        <div className="flex items-center gap-2">
                            <Hash className="text-slate-400" size={16} />
                            <input
                                type="number"
                                min="1"
                                max={
                                    period === 'DAILY'
                                        ? 1
                                        : period === 'WEEKLY'
                                        ? 7
                                        : 30
                                }
                                value={frequency}
                                onChange={(e) =>
                                    setFrequency(parseInt(e.target.value))
                                }
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            <span className="text-sm text-slate-400">
                                times per{' '}
                                {period.toLowerCase().replace('ly', '')}
                            </span>
                        </div>
                    </div>

                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Goal Period
                        </label>
                        <div className="flex items-center gap-2">
                            <Calendar className="text-slate-400" size={16} />
                            <select
                                value={period}
                                onChange={(e) =>
                                    setPeriod(
                                        e.target.value as
                                            | 'DAILY'
                                            | 'WEEKLY'
                                            | 'MONTHLY'
                                    )
                                }
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {/* UI Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Input Type
                        </label>
                        <select
                            value={uiType}
                            onChange={(e) => {
                                setUiType(e.target.value as any);
                                // Reset target value when changing to checkbox or option select
                                if (
                                    e.target.value === 'CHECKBOX' ||
                                    e.target.value === 'OPTION_SELECT'
                                ) {
                                    setHasTargetValue(false);
                                }
                            }}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            <option value="CHECKBOX">Simple Checkbox</option>
                            <option value="NUMBER_INPUT">Number Input</option>
                            <option value="TIME_INPUT">Time Input</option>
                            <option value="OPTION_SELECT">
                                Multiple Choice
                            </option>
                        </select>
                    </div>

                    {/* Options for OPTION_SELECT */}
                    {uiType === 'OPTION_SELECT' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Options (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={uiOptions}
                                onChange={(e) => setUiOptions(e.target.value)}
                                placeholder="e.g., Walk, Run, Bike, Swim"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Target Value Toggle */}
                    {(uiType === 'NUMBER_INPUT' || uiType === 'TIME_INPUT') && (
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasTargetValue}
                                    onChange={(e) =>
                                        setHasTargetValue(e.target.checked)
                                    }
                                    className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                                />
                                <span className="text-sm font-medium text-slate-300">
                                    Set target value condition
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Target Value Configuration */}
                    {hasTargetValue && (
                        <div className="space-y-3 pl-6 border-l-2 border-slate-600">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Target Condition
                                </label>
                                <select
                                    value={targetOperator}
                                    onChange={(e) =>
                                        setTargetOperator(e.target.value as any)
                                    }
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="GREATER_THAN">
                                        Greater than
                                    </option>
                                    <option value="LESS_THAN">Less than</option>
                                    <option value="EQUALS">Equals</option>
                                    <option value="NOT_EQUALS">
                                        Not equals
                                    </option>
                                    {uiType === 'TIME_INPUT' && (
                                        <>
                                            <option value="BEFORE">
                                                Before
                                            </option>
                                            <option value="AFTER">After</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Target Value
                                </label>
                                <div className="flex items-center gap-2">
                                    <Target
                                        className="text-slate-400"
                                        size={16}
                                    />
                                    <input
                                        type={
                                            uiType === 'TIME_INPUT'
                                                ? 'time'
                                                : 'number'
                                        }
                                        min={
                                            uiType === 'NUMBER_INPUT'
                                                ? '1'
                                                : undefined
                                        }
                                        value={targetValue}
                                        onChange={(e) =>
                                            setTargetValue(
                                                uiType === 'TIME_INPUT'
                                                    ? e.target.value
                                                    : parseInt(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <span className="text-sm text-slate-400">
                                        {uiType === 'TIME_INPUT'
                                            ? 'time'
                                            : 'units'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next-Day Completion Option */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allowNextDayCompletion}
                                onChange={(e) =>
                                    setAllowNextDayCompletion(e.target.checked)
                                }
                                className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-slate-300">
                                Allow next-day completion (for sleep/bedtime
                                habits)
                            </span>
                        </label>
                    </div>

                    {/* Grace Days */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasGraceDays}
                                onChange={(e) =>
                                    setHasGraceDays(e.target.checked)
                                }
                                className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-slate-300">
                                Allow grace days (forgiveness for missed days)
                            </span>
                        </label>
                    </div>

                    {/* Grace Days Configuration */}
                    {hasGraceDays && (
                        <div className="space-y-3 pl-6 border-l-2 border-slate-600">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Grace Period
                                </label>
                                <select
                                    value={gracePeriod}
                                    onChange={(e) =>
                                        setGracePeriod(
                                            e.target.value as
                                                | 'WEEKLY'
                                                | 'MONTHLY'
                                        )
                                    }
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Allowed Missed Days
                                </label>
                                <div className="flex items-center gap-2">
                                    <Clock
                                        className="text-slate-400"
                                        size={16}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max={gracePeriod === 'WEEKLY' ? 6 : 30}
                                        value={graceDays}
                                        onChange={(e) =>
                                            setGraceDays(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <span className="text-sm text-slate-400">
                                        missed days per{' '}
                                        {gracePeriod.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Value Frequency Constraint */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasValueConstraint}
                                onChange={(e) =>
                                    setHasValueConstraint(e.target.checked)
                                }
                                className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-slate-300">
                                Add value frequency constraint
                            </span>
                        </label>
                    </div>

                    {/* Value Frequency Configuration */}
                    {hasValueConstraint && (
                        <div className="space-y-3 pl-6 border-l-2 border-slate-600">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Frequency
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={
                                            valueConstraintPeriod === 'WEEKLY'
                                                ? 7
                                                : 30
                                        }
                                        value={valueConstraintFreq}
                                        onChange={(e) =>
                                            setValueConstraintFreq(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Period
                                    </label>
                                    <select
                                        value={valueConstraintPeriod}
                                        onChange={(e) =>
                                            setValueConstraintPeriod(
                                                e.target.value as
                                                    | 'WEEKLY'
                                                    | 'MONTHLY'
                                            )
                                        }
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Condition
                                </label>
                                <select
                                    value={valueConstraintOperator}
                                    onChange={(e) =>
                                        setValueConstraintOperator(
                                            e.target.value as any
                                        )
                                    }
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="GREATER_THAN">
                                        Greater than
                                    </option>
                                    <option value="LESS_THAN">Less than</option>
                                    <option value="EQUALS">Equals</option>
                                    <option value="NOT_EQUALS">
                                        Not equals
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Value
                                </label>
                                <input
                                    type="text"
                                    value={valueConstraintValue}
                                    onChange={(e) =>
                                        setValueConstraintValue(e.target.value)
                                    }
                                    placeholder="Enter constraint value"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex gap-3 p-6 pt-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 transition-colors"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EditHabitsPage() {
    const { currentUserProfile } = useProfile();
    const { habitTemplates, monthlyGoals } = useHabits();
    const router = useRouter();

    const [editingHabit, setEditingHabit] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Get current month's habits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthHabits = monthlyGoals.filter(
        (goal) =>
            goal.userId === currentUserProfile?.uid &&
            goal.month === currentMonth
    );

    const handleEditHabit = (habit: any) => {
        setEditingHabit(habit);
        setShowEditModal(true);
    };

    const handleSaveHabit = async (updatedHabit: any) => {
        if (!currentUserProfile) return;

        try {
            // Update the monthly goal
            const habitDocRef = doc(
                db,
                'monthlyGoals',
                updatedHabit.monthlyGoalId
            );
            await updateDoc(habitDocRef, {
                goal: updatedHabit.goal,
            });

            // Create activity log entry (only if it's not the first day of the month)
            const today = new Date();
            const firstDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

            if (today > firstDayOfMonth && currentUserProfile.coupleId) {
                const template = habitTemplates.find(
                    (t) => t.habitId === updatedHabit.habitId
                );
                const activityText = `${
                    currentUserProfile.name
                } updated the goal for '${
                    template?.name
                }' for ${today.toLocaleDateString('en-US', {
                    month: 'long',
                })}.`;

                await addDoc(collection(db, 'activityLog'), {
                    coupleId: currentUserProfile.coupleId,
                    authorId: currentUserProfile.uid,
                    timestamp: new Date().toISOString(),
                    text: activityText,
                });
            }
        } catch (error) {
            console.error('Error updating habit:', error);
            throw error;
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
                        Edit Habits
                    </h1>
                    <div className="flex-1"></div>
                    <button
                        onClick={() => router.push('/add-habit')}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add Habit
                    </button>
                </div>
                <p className="text-slate-400 px-2">
                    Modify your active habits for{' '}
                    {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>
            </header>

            <main className="p-4">
                {currentMonthHabits.length === 0 ? (
                    <div className="bg-slate-800 rounded-lg p-8 text-center">
                        <Calendar
                            className="mx-auto text-slate-400 mb-4"
                            size={48}
                        />
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">
                            No Active Habits
                        </h3>
                        <p className="text-slate-400 mb-6">
                            You don't have any active habits for this month yet.
                        </p>
                        <button
                            onClick={() => router.push('/add-habit')}
                            className="flex items-center gap-2 mx-auto px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Your First Habit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentMonthHabits.map((habit) => {
                            const template = habitTemplates.find(
                                (t) => t.habitId === habit.habitId
                            );

                            return (
                                <div
                                    key={habit.monthlyGoalId}
                                    className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-100">
                                                {template?.name ||
                                                    'Unknown Habit'}
                                            </h3>
                                            <p className="text-sm text-slate-400 mb-2">
                                                {template?.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-slate-300">
                                                <div className="flex items-center gap-1">
                                                    <Hash size={14} />
                                                    <span>
                                                        {habit.goal
                                                            ?.frequency || 0}
                                                        x per week
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Target size={14} />
                                                    <span>
                                                        {habit.goal?.targetValue
                                                            ?.value || 0}{' '}
                                                        units
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleEditHabit(habit)
                                            }
                                            className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-slate-600 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            <EditHabitModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                habit={editingHabit}
                template={
                    editingHabit
                        ? habitTemplates.find(
                              (t) => t.habitId === editingHabit.habitId
                          )
                        : null
                }
                onSave={handleSaveHabit}
            />
        </div>
    );
}
