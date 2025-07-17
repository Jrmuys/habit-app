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
    Clock
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
    const [targetValue, setTargetValue] = useState(habit?.goal?.targetValue?.value || 1);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (habit) {
            setFrequency(habit.goal?.frequency || 3);
            setTargetValue(habit.goal?.targetValue?.value || 1);
        }
    }, [habit]);

    if (!isOpen || !habit || !template) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedHabit = {
                ...habit,
                goal: {
                    ...habit.goal,
                    frequency,
                    targetValue: habit.goal?.targetValue ? {
                        ...habit.goal.targetValue,
                        value: targetValue
                    } : {
                        operator: 'GREATER_THAN' as const,
                        value: targetValue
                    }
                }
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
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
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

                <div className="space-y-4">
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
                            Weekly Frequency
                        </label>
                        <div className="flex items-center gap-2">
                            <Hash className="text-slate-400" size={16} />
                            <input
                                type="number"
                                min="1"
                                max="7"
                                value={frequency}
                                onChange={(e) => setFrequency(parseInt(e.target.value))}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            <span className="text-sm text-slate-400">times per week</span>
                        </div>
                    </div>

                    {/* Target Value */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Target Value per Session
                        </label>
                        <div className="flex items-center gap-2">
                            <Target className="text-slate-400" size={16} />
                            <input
                                type="number"
                                min="1"
                                value={targetValue}
                                onChange={(e) => setTargetValue(parseInt(e.target.value))}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            <span className="text-sm text-slate-400">{template.unit}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
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
        goal => goal.userId === currentUserProfile?.uid && goal.month === currentMonth
    );

    const handleEditHabit = (habit: any) => {
        setEditingHabit(habit);
        setShowEditModal(true);
    };

    const handleSaveHabit = async (updatedHabit: any) => {
        if (!currentUserProfile) return;

        try {
            // Update the monthly goal
            const habitDocRef = doc(db, 'monthlyGoals', updatedHabit.monthlyGoalId);
            await updateDoc(habitDocRef, {
                goal: updatedHabit.goal,
            });

            // Create activity log entry (only if it's not the first day of the month)
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            if (today > firstDayOfMonth && currentUserProfile.coupleId) {
                const template = habitTemplates.find(t => t.habitId === updatedHabit.habitId);
                const activityText = `${currentUserProfile.name} updated the goal for '${template?.name}' for ${today.toLocaleDateString('en-US', { month: 'long' })}.`;
                
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
                </div>
                <p className="text-slate-400 px-2">
                    Modify your active habits for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </header>

            <main className="p-4">
                {currentMonthHabits.length === 0 ? (
                    <div className="bg-slate-800 rounded-lg p-8 text-center">
                        <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">
                            No Active Habits
                        </h3>
                        <p className="text-slate-400">
                            You don't have any active habits for this month yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentMonthHabits.map((habit) => {
                            const template = habitTemplates.find(t => t.habitId === habit.habitId);
                            
                            return (
                                <div
                                    key={habit.monthlyGoalId}
                                    className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors"
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
                                                    <Hash size={14} />
                                                    <span>{habit.goal?.frequency || 0}x per week</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Target size={14} />
                                                    <span>{habit.goal?.targetValue?.value || 0} units</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEditHabit(habit)}
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
                template={editingHabit ? habitTemplates.find(t => t.habitId === editingHabit.habitId) : null}
                onSave={handleSaveHabit}
            />
        </div>
    );
}
