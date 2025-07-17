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
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
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
    const { habitTemplates } = useHabits();
    const router = useRouter();

    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [frequency, setFrequency] = useState(3);
    const [targetValue, setTargetValue] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Available habit templates (not currently active this month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userTemplates = habitTemplates.filter(
        (template) => template.userId === currentUserProfile?.uid
    );

    const handleCreateTemplate = async (templateData: any) => {
        if (!currentUserProfile) return;

        try {
            const habitId = `habit_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

            // Create the habit template
            const habitDocRef = doc(db, 'habits', habitId);
            await setDoc(habitDocRef, {
                habitId,
                userId: currentUserProfile.uid,
                name: templateData.name,
                description: templateData.description,
                createdAt: new Date().toISOString(),
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
            // Create monthly goal for current month
            await addDoc(collection(db, 'monthlyGoals'), {
                userId: currentUserProfile.uid,
                habitId: selectedTemplate.habitId,
                month: currentMonth,
                ui: {
                    type: 'CHECKBOX',
                },
                goal: {
                    period: 'WEEKLY',
                    frequency: frequency,
                    targetValue: {
                        operator: 'GREATER_THAN',
                        value: targetValue,
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
                            {/* Frequency */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Weekly Frequency
                                </label>
                                <div className="flex items-center gap-2">
                                    <Hash
                                        className="text-slate-400"
                                        size={16}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={frequency}
                                        onChange={(e) =>
                                            setFrequency(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <span className="text-sm text-slate-400">
                                        times per week
                                    </span>
                                </div>
                            </div>

                            {/* Target Value */}
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
                                        units
                                    </span>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-700 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-slate-300 mb-2">
                                    Summary
                                </h3>
                                <p className="text-slate-100">
                                    <strong>{selectedTemplate.name}</strong> -{' '}
                                    {frequency} times per week, {targetValue}{' '}
                                    units each time
                                </p>
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
