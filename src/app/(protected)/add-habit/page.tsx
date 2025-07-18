'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Target,
    Hash,
    Clock,
    CheckCircle,
    Calendar,
    Lightbulb,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create New Habit Template Modal
function CreateHabitTemplateModal({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: any) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const template = {
                name: name.trim(),
                description: description.trim(),
            };
            await onSave(template);
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Error creating habit template:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">
                        Create New Habit
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Habit Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Run, Read Books, Meditate"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this habit..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? 'Creating...' : 'Create Habit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AddHabitPage() {
    const { currentUserProfile } = useProfile();
    const { habitTemplates, createHabitTemplate, createMonthlyGoal } =
        useHabits();
    const router = useRouter();

    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [frequency, setFrequency] = useState(3);
    const [targetValue, setTargetValue] = useState(1);
    const [hasTargetValue, setHasTargetValue] = useState(false);
    const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
        'WEEKLY'
    );
    const [uiType, setUiType] = useState<
        'CHECKBOX' | 'NUMBER_INPUT' | 'TIME_INPUT' | 'OPTION_SELECT'
    >('CHECKBOX');
    const [uiOptions, setUiOptions] = useState('');

    // Grace Days Constraint
    const [graceDays, setGraceDays] = useState(0);
    const [hasGraceDays, setHasGraceDays] = useState(false);
    const [gracePeriod, setGracePeriod] = useState<'WEEKLY' | 'MONTHLY'>(
        'WEEKLY'
    );

    // Value Frequency Constraint
    const [hasValueConstraint, setHasValueConstraint] = useState(false);
    const [valueConstraintFreq, setValueConstraintFreq] = useState(3);
    const [valueConstraintPeriod, setValueConstraintPeriod] = useState<
        'WEEKLY' | 'MONTHLY'
    >('WEEKLY');
    const [valueConstraintOperator, setValueConstraintOperator] = useState<
        'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN'
    >('NOT_EQUALS');
    const [valueConstraintValue, setValueConstraintValue] = useState('');

    // Next-day completion option
    const [allowNextDayCompletion, setAllowNextDayCompletion] = useState(false);

    const [isAdding, setIsAdding] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        // When UI type changes, reset target value if it's not applicable
        if (uiType === 'CHECKBOX' || uiType === 'OPTION_SELECT') {
            setHasTargetValue(false);
        }
    }, [uiType]);

    // Available habit templates (not currently active this month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userTemplates = habitTemplates.filter(
        (template) => template.userId === currentUserProfile?.uid
    );

    const handleCreateTemplate = async (templateData: any) => {
        if (!currentUserProfile) return;

        try {
            // Create the habit template using the useHabits hook
            await createHabitTemplate({
                name: templateData.name,
                description: templateData.description,
                icon: '📋', // Add default icon
            });
        } catch (error) {
            console.error('Error creating habit template:', error);
            throw error;
        }
    };

    const handleAddHabit = async () => {
        if (!currentUserProfile || !selectedTemplate) return;

        setIsAdding(true);
        try {
            // Build constraints array
            const constraints: any[] = [];

            // Add Grace Days Constraint if enabled
            if (hasGraceDays && graceDays > 0) {
                constraints.push({
                    type: 'GRACE_DAYS',
                    period: gracePeriod,
                    allowance: graceDays,
                });
            }

            // Add Value Frequency Constraint if enabled
            if (
                hasValueConstraint &&
                valueConstraintFreq > 0 &&
                valueConstraintValue.trim()
            ) {
                constraints.push({
                    type: 'VALUE_FREQUENCY',
                    period: valueConstraintPeriod,
                    frequency: valueConstraintFreq,
                    targetValue: {
                        operator: valueConstraintOperator,
                        value: valueConstraintValue.trim(),
                    },
                });
            }

            // Create monthly goal for current month using the hook
            await createMonthlyGoal({
                habitId: selectedTemplate.habitId,
                month: currentMonth,
                ui: {
                    type: uiType,
                    ...(uiType === 'OPTION_SELECT' && {
                        options: uiOptions
                            .split(',')
                            .map((opt) => opt.trim())
                            .filter(Boolean),
                    }),
                },
                goal: {
                    period: period,
                    frequency: frequency,
                    ...(hasTargetValue && {
                        targetValue: {
                            operator: 'GREATER_THAN',
                            value: targetValue,
                        },
                    }),
                },
                logging: {
                    window: {
                        startOffsetHours: 0,
                        endOffsetHours: 24,
                    },
                    allowNextDayCompletion: allowNextDayCompletion,
                },
                constraints: constraints,
            });

            // Create activity log entry
            if (currentUserProfile.coupleId) {
                await addDoc(collection(db, 'activityLog'), {
                    coupleId: currentUserProfile.coupleId,
                    authorId: currentUserProfile.uid,
                    timestamp: new Date().toISOString(),
                    text: `${currentUserProfile.name} added a new habit: '${
                        selectedTemplate.name
                    }' for ${new Date().toLocaleDateString('en-US', {
                        month: 'long',
                    })}.`,
                });
            }

            // Navigate back to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error adding habit:', error);
        } finally {
            setIsAdding(false);
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
                        Add Habit
                    </h1>
                </div>
                <p className="text-slate-400 px-2">
                    Add a new habit to{' '}
                    {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>
            </header>

            <main className="p-4 space-y-6">
                {/* Step 1: Choose or Create Habit */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-100">
                            Choose a Habit
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            <Plus size={16} />
                            Create New
                        </button>
                    </div>

                    {userTemplates.length === 0 ? (
                        <div className="text-center py-8">
                            <Lightbulb
                                className="mx-auto text-slate-400 mb-4"
                                size={48}
                            />
                            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                                No Habit Templates Yet
                            </h3>
                            <p className="text-slate-400 mb-4">
                                Create your first habit template to get started.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                            >
                                Create Your First Habit
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {userTemplates.map((template) => (
                                <button
                                    key={template.habitId}
                                    onClick={() =>
                                        setSelectedTemplate(template)
                                    }
                                    className={`text-left p-4 rounded-lg border transition-colors ${
                                        selectedTemplate?.habitId ===
                                        template.habitId
                                            ? 'bg-cyan-600/20 border-cyan-500 text-cyan-100'
                                            : 'bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 ${
                                                selectedTemplate?.habitId ===
                                                template.habitId
                                                    ? 'bg-cyan-500 border-cyan-500'
                                                    : 'border-slate-400'
                                            }`}
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold">
                                                {template.name}
                                            </h3>
                                            {template.description && (
                                                <p className="text-sm text-slate-400">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step 2: Configure Goals (only show if habit selected) */}
                {selectedTemplate && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">
                            Configure Goals
                        </h2>

                        <div className="space-y-4">
                            {/* Entry Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Entry Type
                                </label>
                                <div className="flex items-center gap-2">
                                    <CheckCircle
                                        className="text-slate-400"
                                        size={16}
                                    />
                                    <select
                                        value={uiType}
                                        onChange={(e) => {
                                            setUiType(e.target.value as any);
                                            if (
                                                e.target.value !==
                                                'OPTION_SELECT'
                                            ) {
                                                setUiOptions('');
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    >
                                        <option value="CHECKBOX">
                                            Checkbox (Simple Yes/No)
                                        </option>
                                        <option value="NUMBER_INPUT">
                                            Number (e.g., miles, reps)
                                        </option>
                                        <option value="TIME_INPUT">
                                            Time (e.g., duration)
                                        </option>
                                        <option value="OPTION_SELECT">
                                            Options (Select from a list)
                                        </option>
                                    </select>
                                </div>
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
                                        onChange={(e) =>
                                            setUiOptions(e.target.value)
                                        }
                                        placeholder="e.g., Walk, Run, Bike, Swim"
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Period */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Goal Period
                                </label>
                                <div className="flex items-center gap-2">
                                    <Calendar
                                        className="text-slate-400"
                                        size={16}
                                    />
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

                            {/* Frequency */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Frequency ({period.toLowerCase()})
                                </label>
                                <div className="flex items-center gap-2">
                                    <Hash
                                        className="text-slate-400"
                                        size={16}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max={
                                            period === 'DAILY'
                                                ? 1
                                                : period === 'WEEKLY'
                                                ? 7
                                                : 31
                                        }
                                        value={frequency}
                                        onChange={(e) =>
                                            setFrequency(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <span className="text-sm text-slate-400">
                                        times per {period.toLowerCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Target Value Toggle */}
                            {(uiType === 'NUMBER_INPUT' ||
                                uiType === 'TIME_INPUT') && (
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasTargetValue}
                                            onChange={(e) =>
                                                setHasTargetValue(
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                                        />
                                        <span className="text-sm font-medium text-slate-300">
                                            Set target value per entry
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Target Value */}
                            {hasTargetValue && (
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
                                            type="number"
                                            min="1"
                                            value={targetValue}
                                            onChange={(e) =>
                                                setTargetValue(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                        <span className="text-sm text-slate-400">
                                            units minimum
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Grace Days Toggle */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasGraceDays}
                                        onChange={(e) =>
                                            setHasGraceDays(e.target.checked)
                                        }
                                        className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-slate-300">
                                        Allow grace days (forgiveness for missed
                                        days)
                                    </span>
                                </label>
                            </div>

                            {/* Next-Day Completion Option */}
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowNextDayCompletion}
                                        onChange={(e) =>
                                            setAllowNextDayCompletion(
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                                    />
                                    <span className="text-sm font-medium text-slate-300">
                                        Allow next-day completion (for
                                        sleep/bedtime habits)
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
                                            <option value="WEEKLY">
                                                Weekly
                                            </option>
                                            <option value="MONTHLY">
                                                Monthly
                                            </option>
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
                                                max={
                                                    gracePeriod === 'WEEKLY'
                                                        ? 6
                                                        : 30
                                                }
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

                            {/* Value Frequency Constraint Toggle */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasValueConstraint}
                                        onChange={(e) =>
                                            setHasValueConstraint(
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                                    />
                                    <span className="text-sm font-medium text-slate-300">
                                        Add value-based requirement
                                    </span>
                                </label>
                                <p className="text-xs text-slate-400 mt-1 ml-6">
                                    e.g., "Do something other than walking 3
                                    times per week"
                                </p>
                            </div>

                            {/* Value Frequency Constraint Configuration */}
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
                                                <option value="WEEKLY">
                                                    Weekly
                                                </option>
                                                <option value="MONTHLY">
                                                    Monthly
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Value Condition
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select
                                                value={valueConstraintOperator}
                                                onChange={(e) =>
                                                    setValueConstraintOperator(
                                                        e.target.value as any
                                                    )
                                                }
                                                className="px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            >
                                                <option value="EQUALS">
                                                    Equals
                                                </option>
                                                <option value="NOT_EQUALS">
                                                    Not equals
                                                </option>
                                                <option value="GREATER_THAN">
                                                    Greater than
                                                </option>
                                                <option value="LESS_THAN">
                                                    Less than
                                                </option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Value"
                                                value={valueConstraintValue}
                                                onChange={(e) =>
                                                    setValueConstraintValue(
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-2 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Example: "NOT_EQUALS Walking" means{' '}
                                            {valueConstraintFreq} entries per{' '}
                                            {valueConstraintPeriod.toLowerCase()}{' '}
                                            must not be "Walking"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="bg-slate-700 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-slate-300 mb-2">
                                    Summary
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-slate-100">
                                        <strong>Primary Goal:</strong>{' '}
                                        {selectedTemplate.name} - {frequency}{' '}
                                        times per {period.toLowerCase()}
                                        {hasTargetValue &&
                                            `, ${targetValue} units minimum each time`}
                                    </p>
                                    {hasGraceDays && graceDays > 0 && (
                                        <p className="text-cyan-300 text-sm">
                                            <strong>Grace Days:</strong> Allow{' '}
                                            {graceDays} missed days per{' '}
                                            {gracePeriod.toLowerCase()}
                                        </p>
                                    )}
                                    {hasValueConstraint &&
                                        valueConstraintValue.trim() && (
                                            <p className="text-emerald-300 text-sm">
                                                <strong>
                                                    Value Requirement:
                                                </strong>{' '}
                                                {valueConstraintFreq} entries
                                                per{' '}
                                                {valueConstraintPeriod.toLowerCase()}{' '}
                                                must be{' '}
                                                {valueConstraintOperator
                                                    .toLowerCase()
                                                    .replace('_', ' ')}{' '}
                                                "{valueConstraintValue}"
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Button */}
                {selectedTemplate && (
                    <button
                        onClick={handleAddHabit}
                        disabled={isAdding}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <CheckCircle size={20} />
                        {isAdding
                            ? 'Adding Habit...'
                            : 'Add Habit to This Month'}
                    </button>
                )}
            </main>

            {/* Create Habit Template Modal */}
            <CreateHabitTemplateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateTemplate}
            />
        </div>
    );
}
