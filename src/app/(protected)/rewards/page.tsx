'use client';

import { useState, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRewards } from '@/hooks/useRewards';
import { Plus, Gift } from 'lucide-react';

// Add/Edit Reward Modal Component
function RewardModal({
    isOpen,
    onClose,
    onSave,
    editingReward = null,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, cost: number) => void;
    editingReward?: { name: string; cost: number } | null;
}) {
    const [name, setName] = useState(editingReward?.name || '');
    const [cost, setCost] = useState(editingReward?.cost?.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && cost.trim()) {
            onSave(name.trim(), parseInt(cost));
            setName('');
            setCost('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                    {editingReward ? 'Edit Reward' : 'Add New Reward'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Reward Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-slate-100 text-base rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter reward name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Point Cost
                        </label>
                        <input
                            type="number"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-slate-100 text-base rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter point cost"
                            min="1"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex-1"
                        >
                            {editingReward ? 'Update' : 'Add'} Reward
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function RewardsPage() {
    const { currentUserProfile } = useProfile();
    const { rewards, createReward, purchaseReward, error } = useRewards();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<any>(null);

    const userPoints = currentUserProfile?.points || 0;

    // Sort rewards by cost
    const sortedRewards = useMemo(() => {
        return [...rewards].sort((a, b) => a.cost - b.cost);
    }, [rewards]);

    const handleAddReward = async (name: string, cost: number) => {
        try {
            await createReward({ name, cost });
        } catch (err) {
            console.error('Failed to create reward:', err);
        }
    };

    const handleRedeemReward = async (rewardId: string, cost: number) => {
        if (userPoints < cost) return;

        try {
            await purchaseReward(rewardId);
        } catch (err) {
            console.error('Failed to redeem reward:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header Section */}
            <header className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-slate-100">
                        Rewards
                    </h1>
                </div>

                {/* Points Balance */}
                <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Gift className="text-cyan-500" size={24} />
                            <div>
                                <p className="text-sm font-medium text-slate-400">
                                    Your Points
                                </p>
                                <p className="text-2xl font-bold text-slate-100">
                                    {userPoints}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add Reward
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 space-y-6">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Rewards List */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Available Rewards
                    </h2>

                    {sortedRewards.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg p-8 shadow-lg">
                            <div className="text-center">
                                <Gift
                                    className="mx-auto text-slate-600 mb-4"
                                    size={48}
                                />
                                <p className="text-slate-400 mb-4">
                                    No rewards yet
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Add Your First Reward
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedRewards.map((reward) => {
                                const canAfford = userPoints >= reward.cost;

                                return (
                                    <div
                                        key={reward.rewardId}
                                        className="bg-slate-800 rounded-lg p-4 shadow-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-100">
                                                    {reward.name}
                                                </h3>
                                                <p className="text-sm font-medium text-cyan-400">
                                                    {reward.cost} points
                                                </p>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleRedeemReward(
                                                        reward.rewardId,
                                                        reward.cost
                                                    )
                                                }
                                                disabled={!canAfford}
                                                className={`font-semibold py-2 px-4 rounded-lg transition-colors ${
                                                    canAfford
                                                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                Redeem
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Add/Edit Reward Modal */}
            <RewardModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingReward(null);
                }}
                onSave={handleAddReward}
                editingReward={editingReward}
            />
        </div>
    );
}
