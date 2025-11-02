'use client';

import { useState } from 'react';
import { Plus, X, Shield, TrendingUp, Target, Info } from 'lucide-react';
import {
    HabitTemplate,
    HabitMilestone,
    ConstraintRule,
    ValueFrequencyConstraint,
} from '@/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useProfile } from '@/hooks/useProfile';

type HabitCreateFormProps = {
    onSuccess?: () => void;
    onCancel?: () => void;
};

export default function HabitCreateForm({
    onSuccess,
    onCancel,
}: HabitCreateFormProps) {
    const { userProfile } = useProfile();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<'DAILY' | 'CUSTOM'>('DAILY');
    const [basePoints, setBasePoints] = useState(100);
    // Note: streakShield is always enabled automatically at 7-day streaks
    // This UI toggle is just for preview/information purposes
    const [streakShield, setStreakShield] = useState(true);
    const [allowPartial, setAllowPartial] = useState(false);
    const [milestones, setMilestones] = useState<HabitMilestone[]>([]);
    const [constraints, setConstraints] = useState<ConstraintRule[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Milestone form state
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [newMilestonePoints, setNewMilestonePoints] = useState(500);

    // Constraint form state
    const [showConstraintForm, setShowConstraintForm] = useState(false);
    const [newConstraintValue, setNewConstraintValue] = useState('');
    const [newConstraintFrequency, setNewConstraintFrequency] = useState(1);
    const [newConstraintPeriod, setNewConstraintPeriod] = useState<
        'DAILY' | 'WEEKLY' | 'MONTHLY'
    >('WEEKLY');

    const handleAddMilestone = () => {
        if (newMilestoneName.trim()) {
            setMilestones([
                ...milestones,
                {
                    name: newMilestoneName.trim(),
                    pointValue: newMilestonePoints,
                },
            ]);
            setNewMilestoneName('');
            setNewMilestonePoints(500);
        }
    };

    const handleRemoveMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleAddConstraint = () => {
        if (newConstraintValue.trim()) {
            const constraint: ValueFrequencyConstraint = {
                type: 'VALUE_FREQUENCY',
                period: newConstraintPeriod,
                frequency: newConstraintFrequency,
                targetValue: {
                    operator: 'EQUALS',
                    value: newConstraintValue.trim(),
                },
            };
            setConstraints([...constraints, constraint]);
            setNewConstraintValue('');
            setNewConstraintFrequency(1);
            setShowConstraintForm(false);
        }
    };

    const handleRemoveConstraint = (index: number) => {
        setConstraints(constraints.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !userProfile) return;

        setIsSaving(true);
        try {
            // Create habit template
            const habitTemplate: Omit<HabitTemplate, 'habitId'> = {
                userId: userProfile.uid,
                name: name.trim(),
                description: description.trim() || undefined,
                allowPartial,
                basePoints,
                milestones: milestones.length > 0 ? milestones : undefined,
                createdAt: new Date().toISOString(),
            };

            const habitRef = await addDoc(
                collection(db, 'habits'),
                habitTemplate
            );

            // Create monthly goal for current month
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthlyGoal = {
                userId: userProfile.uid,
                habitId: habitRef.id,
                month: currentMonth,
                // TODO: Allow UI type configuration in future version
                ui: { type: 'CHECKBOX' },
                goal: {
                    period: frequency,
                    frequency: frequency === 'DAILY' ? 1 : 5, // Default to 5 times for custom
                },
                logging: {
                    window: {
                        startOffsetHours: 0,
                        endOffsetHours: 24,
                    },
                },
                constraints,
            };

            await addDoc(collection(db, 'monthlyGoals'), monthlyGoal);

            // Create individual milestone documents if any
            if (milestones.length > 0) {
                for (const milestone of milestones) {
                    await addDoc(collection(db, 'milestones'), {
                        userId: userProfile.uid,
                        habitId: habitRef.id,
                        name: milestone.name,
                        pointValue: milestone.pointValue,
                        isCompleted: false,
                        createdAt: new Date().toISOString(),
                    });
                }
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error creating habit:', error);
            alert('Failed to create habit. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate preview values for a sample streak
    const calculatePreviewPoints = (streakDays: number) => {
        let multiplier = 1.0;
        if (streakDays >= 14) multiplier = 1.5;
        else if (streakDays >= 7) multiplier = 1.2;

        return {
            base: Math.round(basePoints * multiplier),
            partial: 25, // Partial/Just Show Up always awards 25 points with NO multiplier
            multiplier,
        };
    };

    const preview7Days = calculatePreviewPoints(7);
    const preview14Days = calculatePreviewPoints(14);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-slate-100">
                        Create New Habit
                    </h1>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Basic Info */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Basic Information
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Habit Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Exercise, Read 30 Minutes"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
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
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Frequency
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) =>
                                setFrequency(
                                    e.target.value as 'DAILY' | 'CUSTOM'
                                )
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="DAILY">Daily</option>
                            <option value="CUSTOM">Custom</option>
                        </select>
                    </div>
                </div>

                {/* Points Configuration */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Points Configuration
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Base Points (Full Completion)
                        </label>
                        <input
                            type="number"
                            value={basePoints}
                            onChange={(e) =>
                                setBasePoints(Number(e.target.value))
                            }
                            min="1"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Points earned for full completion, eligible for
                            streak multiplier
                        </p>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-sm font-medium text-slate-300 mb-1">
                            Partial Completion Points: 25 (Fixed)
                        </div>
                        <p className="text-xs text-slate-400">
                            Partial completion always awards 25 points with no
                            multiplier
                        </p>
                    </div>
                </div>

                {/* Streak Features */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Streak Features
                    </h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-300">
                                Streak Shield
                            </span>
                            <div className="relative group">
                                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                                <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-700 text-xs text-slate-300 rounded shadow-lg z-10">
                                    Earned every 7 days of full completion
                                    streak (7, 14, 21...). Protects against
                                    first missed day.
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStreakShield(!streakShield)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                streakShield ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    streakShield
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-cyan-500" />
                            <span className="text-sm font-medium text-slate-300">
                                Streak Multiplier
                            </span>
                            <div className="relative group">
                                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                                <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-600 text-xs text-slate-300 rounded shadow-lg z-10">
                                    Only applies to FULL completions.
                                    Partial/Just Show Up do NOT get multipliers.
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-400">
                            <div>Days 0-6: 1.0x (no multiplier)</div>
                            <div>Days 7-13: 1.2x multiplier</div>
                            <div>Days 14+: 1.5x multiplier</div>
                            <div className="text-orange-400 text-xs mt-2">
                                ⚠️ Only full completions count toward streak and
                                earn multipliers
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partial Completion / Just Show Up */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">
                                Partial Completion / Just Show Up
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Allow logging partial effort. Awards 25 points
                                with NO multiplier.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAllowPartial(!allowPartial)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                allowPartial ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    allowPartial
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {allowPartial && (
                        <div className="bg-slate-700 rounded-lg p-4">
                            <p className="text-sm text-slate-300">
                                When enabled, you can log any effort even if you
                                didn&apos;t fully complete the habit.
                            </p>
                            <div className="mt-3 text-xs text-slate-400 space-y-1">
                                <div>✓ Maintains your streak</div>
                                <div>✓ Awards 25 points (fixed)</div>
                                <div>✗ Does NOT get streak multipliers</div>
                                <div>
                                    ✗ Does NOT count toward earning shields
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Milestones */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Milestones
                    </h2>

                    {milestones.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {milestones.map((milestone, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Target className="h-5 w-5 text-orange-500" />
                                        <div>
                                            <div className="font-medium text-slate-100">
                                                {milestone.name}
                                            </div>
                                            <div className="text-sm text-orange-500">
                                                {milestone.pointValue} pts
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveMilestone(index)
                                        }
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newMilestoneName}
                            onChange={(e) =>
                                setNewMilestoneName(e.target.value)
                            }
                            placeholder="Milestone name (e.g., 30-day streak)"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={newMilestonePoints}
                                onChange={(e) =>
                                    setNewMilestonePoints(
                                        Number(e.target.value)
                                    )
                                }
                                placeholder="Points"
                                min="1"
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddMilestone}
                                className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Constraints */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Constraints (Optional)
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Add frequency requirements for specific values (e.g.,
                        &quot;Gym&quot; 3x per week)
                    </p>

                    {constraints.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {constraints.map((constraint, index) => {
                                if (constraint.type === 'VALUE_FREQUENCY') {
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
                                        >
                                            <div className="text-sm text-slate-100">
                                                <strong>
                                                    {
                                                        constraint.targetValue
                                                            .value
                                                    }
                                                </strong>
                                                : {constraint.frequency}x per{' '}
                                                {constraint.period.toLowerCase()}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveConstraint(
                                                        index
                                                    )
                                                }
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}

                    {!showConstraintForm ? (
                        <button
                            type="button"
                            onClick={() => setShowConstraintForm(true)}
                            className="px-4 py-2 bg-slate-700 text-slate-100 font-semibold rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Constraint
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newConstraintValue}
                                onChange={(e) =>
                                    setNewConstraintValue(e.target.value)
                                }
                                placeholder="Value (e.g., Gym, Run)"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={newConstraintFrequency}
                                    onChange={(e) =>
                                        setNewConstraintFrequency(
                                            Number(e.target.value)
                                        )
                                    }
                                    placeholder="Times"
                                    min="1"
                                    className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <select
                                    value={newConstraintPeriod}
                                    onChange={(e) =>
                                        setNewConstraintPeriod(
                                            e.target.value as
                                                | 'DAILY'
                                                | 'WEEKLY'
                                                | 'MONTHLY'
                                        )
                                    }
                                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="DAILY">per Day</option>
                                    <option value="WEEKLY">per Week</option>
                                    <option value="MONTHLY">per Month</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleAddConstraint}
                                    className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConstraintForm(false)}
                                    className="px-4 py-2 bg-slate-700 text-slate-100 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Preview */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Points Preview
                    </h2>

                    <div className="space-y-3">
                        <div className="bg-slate-700 rounded-lg p-4">
                            <div className="font-semibold text-slate-100 mb-2">
                                Days 0-6 (No Multiplier)
                            </div>
                            <div className="space-y-1 text-sm text-slate-300">
                                <div>Full completion: {basePoints} pts</div>
                                {allowPartial && (
                                    <div className="text-slate-400">
                                        Partial completion: 25 pts (no
                                        multiplier)
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-700 rounded-lg p-4">
                            <div className="font-semibold text-slate-100 mb-2">
                                Days 7-13 ({preview7Days.multiplier}x
                                Multiplier)
                                {streakShield && (
                                    <span className="ml-2 text-emerald-500 text-sm">
                                        + Shield Earned
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 text-sm text-slate-300">
                                <div>
                                    Full completion: {preview7Days.base} pts
                                </div>
                                {allowPartial && (
                                    <div className="text-slate-400">
                                        Partial completion: 25 pts (no
                                        multiplier)
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-700 rounded-lg p-4">
                            <div className="font-semibold text-slate-100 mb-2">
                                Days 14+ ({preview14Days.multiplier}x
                                Multiplier)
                                {streakShield && (
                                    <span className="ml-2 text-emerald-500 text-sm">
                                        + Shield Earned
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 text-sm text-slate-300">
                                <div>
                                    Full completion: {preview14Days.base} pts
                                </div>
                                {allowPartial && (
                                    <div className="text-slate-400">
                                        Partial completion: 25 pts (no
                                        multiplier)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pb-6">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 bg-slate-700 text-slate-100 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={!name.trim() || isSaving}
                        className="flex-1 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Creating...' : 'Create Habit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
