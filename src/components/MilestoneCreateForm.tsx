'use client';

import { useState } from 'react';
import { Target, X } from 'lucide-react';
import { MilestoneSize, getMilestonePoints } from '@/types/misc';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useProfile } from '@/hooks/useProfile';

type MilestoneCreateFormProps = {
    onSuccess?: () => void;
    onCancel?: () => void;
};

export default function MilestoneCreateForm({
    onSuccess,
    onCancel,
}: MilestoneCreateFormProps) {
    const { currentUserProfile } = useProfile();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [size, setSize] = useState<MilestoneSize>('MEDIUM');
    const [isSaving, setIsSaving] = useState(false);

    const pointValue = getMilestonePoints(size);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !currentUserProfile) return;

        setIsSaving(true);
        try {
            const milestoneData: any = {
                userId: currentUserProfile.uid,
                name: name.trim(),
                size,
                isCompleted: false,
                createdAt: new Date().toISOString(),
            };

            // Only add description if it's not empty
            if (description.trim()) {
                milestoneData.description = description.trim();
            }

            await addDoc(collection(db, 'milestones'), milestoneData);

            if (onSuccess) {
                onSuccess();
            }

            // Reset form
            setName('');
            setDescription('');
            setSize('MEDIUM');
        } catch (error) {
            console.error('Error creating milestone:', error);
            alert('Failed to create milestone. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-900 text-slate-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-slate-100">
                        Create New Milestone
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
                        Milestone Information
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Milestone Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Schedule dentist appointment"
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
                            placeholder="Brief description of this one-time task..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>
                </div>

                {/* Size Selection */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Milestone Size
                    </h2>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Small */}
                        <button
                            type="button"
                            onClick={() => setSize('SMALL')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                size === 'SMALL'
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Target className="h-6 w-6 text-green-500" />
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-100">
                                            Small
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            Quick tasks
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-green-500">
                                    150 pts
                                </div>
                            </div>
                        </button>

                        {/* Medium */}
                        <button
                            type="button"
                            onClick={() => setSize('MEDIUM')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                size === 'MEDIUM'
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Target className="h-6 w-6 text-orange-500" />
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-100">
                                            Medium
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            Moderate tasks
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-orange-500">
                                    500 pts
                                </div>
                            </div>
                        </button>

                        {/* Large */}
                        <button
                            type="button"
                            onClick={() => setSize('LARGE')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                size === 'LARGE'
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Target className="h-6 w-6 text-red-500" />
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-100">
                                            Large
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            Major tasks
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-red-500">
                                    1500 pts
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Preview
                    </h2>
                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-lg text-slate-100">
                                    {name || 'Milestone Name'}
                                </div>
                                {description && (
                                    <div className="text-sm text-slate-400 mt-1">
                                        {description}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400 uppercase">
                                    {size}
                                </div>
                                <div className="text-2xl font-bold text-cyan-500">
                                    {pointValue} pts
                                </div>
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
                        {isSaving ? 'Creating...' : 'Create Milestone'}
                    </button>
                </div>
            </form>
        </div>
    );
}
