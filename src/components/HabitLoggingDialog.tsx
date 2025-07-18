'use client';

import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { MonthlyGoal } from '@/types';
import { X, Send } from 'lucide-react';

interface HabitLoggingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    monthlyGoal: MonthlyGoal;
    targetDate: string;
    existingEntry: any;
}

export default function HabitLoggingDialog({
    isOpen,
    onClose,
    monthlyGoal,
    targetDate,
    existingEntry,
}: HabitLoggingDialogProps) {
    const { logHabitEntry, deleteHabitEntry } = useHabits();
    const [value, setValue] = useState<string | number>(
        existingEntry?.value ||
            (monthlyGoal.ui.type === 'NUMBER_INPUT' ? 0 : '')
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleLogHabit = async () => {
        if (value === '' || value === null) return;

        setIsSubmitting(true);
        try {
            await logHabitEntry({
                monthlyGoalId: monthlyGoal.monthlyGoalId,
                targetDate: targetDate,
                value: value,
            });
            onClose();
        } catch (error) {
            console.error('Error logging habit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUndoLog = async () => {
        if (!existingEntry) return;
        setIsSubmitting(true);
        try {
            await deleteHabitEntry(existingEntry.entryId);
            onClose();
        } catch (error) {
            console.error('Error deleting habit entry:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderInput = () => {
        switch (monthlyGoal.ui.type) {
            case 'NUMBER_INPUT':
                return (
                    <input
                        type="number"
                        value={value as number}
                        onChange={(e) =>
                            setValue(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter value..."
                        autoFocus
                    />
                );
            case 'TIME_INPUT':
                return (
                    <input
                        type="time"
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                    />
                );
            case 'OPTION_SELECT':
                return (
                    <select
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                    >
                        <option value="">Select an option...</option>
                        {monthlyGoal.ui.options?.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">
                        Log Habit
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {existingEntry ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-emerald-400 font-semibold text-lg mb-2">
                                Already logged: {existingEntry.value}
                            </p>
                            <p className="text-slate-400 text-sm">
                                You can undo this entry to log a new value
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUndoLog}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-600 transition-colors"
                            >
                                {isSubmitting ? 'Undoing...' : 'Undo Entry'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {renderInput()}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogHabit}
                                disabled={
                                    isSubmitting ||
                                    !value ||
                                    (monthlyGoal.ui.type === 'OPTION_SELECT' &&
                                        value === '')
                                }
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 transition-colors"
                            >
                                <Send size={16} />
                                {isSubmitting ? 'Logging...' : 'Log Entry'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
