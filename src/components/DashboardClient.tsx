'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Shield, TrendingUp, Target, CheckCircle2, Flame, Plus } from 'lucide-react';
import HabitLoggingDialog from '@/components/HabitLoggingDialog';
import { DashboardState } from '@/lib/dashboardFunctions';
import { useHabitsSimplified } from '@/hooks/useHabitsSimplified';
import { MonthlyGoal, HabitEntry } from '@/types';
import { getMilestonePoints } from '@/types/misc';

type DashboardClientProps = {
    dashboardState: DashboardState;
};

export default function DashboardClient({ dashboardState }: DashboardClientProps) {
    const router = useRouter();
    const { logHabitEntry } = useHabitsSimplified();

    const {
        currentUserProfile,
        todaysHabits,
        yesterdayHabits,
        milestones,
    } = dashboardState;

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<{
        goal: MonthlyGoal;
        targetDate: string;
        existingEntry: HabitEntry | undefined;
    } | null>(null);

    // Handle habit click
    const handleHabitClick = async (
        goal: MonthlyGoal,
        targetDate: string,
        existingEntry: HabitEntry | undefined
    ) => {
        if (goal.ui.type === 'CHECKBOX') {
            // For checkbox habits, log directly without dialog
            if (!existingEntry) {
                try {
                    await logHabitEntry({
                        monthlyGoalId: goal.monthlyGoalId,
                        targetDate: targetDate,
                        value: true,
                    });
                } catch (error) {
                    console.error('Error logging habit:', error);
                }
            }
        } else {
            // For other types, open dialog
            setSelectedHabit({ goal, targetDate, existingEntry });
            setDialogOpen(true);
        }
    };

    const userPoints = currentUserProfile?.points || 0;
    const activeMilestones = milestones.filter(m => !m.isCompleted);
    const completedMilestones = milestones.filter(m => m.isCompleted);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header with Points */}
            <header className="bg-slate-800 border-b border-slate-700 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/create-habit')}
                            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors"
                            title="Create New Habit"
                        >
                            <Plus className="h-6 w-6 text-white" />
                        </button>
                        <button
                            onClick={() => router.push('/edit-habits')}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Edit Habits"
                        >
                            <Edit3 className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>
                </div>
                
                {/* Points Display */}
                <div className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500 rounded-full p-3">
                            <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total Points</p>
                            <p className="text-4xl font-bold text-cyan-500">{userPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-6 pb-20">
                {/* Today's Habits Section */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Today's Habits</h2>
                    <div className="space-y-3">
                        {todaysHabits.map((habit) => {
                            const { goal, template, entry, today, streak, recentHistory } = habit;
                            const isCompleted = !!entry;
                            
                            // Calculate points for this completion
                            const basePoints = 100;
                            const earnedPoints = Math.round(basePoints * streak.multiplier);

                            return (
                                <div
                                    key={goal.monthlyGoalId}
                                    className="bg-slate-800 rounded-lg shadow-lg p-4 cursor-pointer transition-all hover:bg-slate-750 hover:shadow-xl"
                                    onClick={() => handleHabitClick(goal, today, entry)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Status Circle */}
                                        <div
                                            className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-7 w-7 text-white" />
                                            ) : (
                                                <span className="text-2xl">{template?.icon || '⭐'}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Habit Name and Streak */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-slate-100">
                                                    {template?.name || 'Unnamed Habit'}
                                                </h3>
                                                {streak.currentStreak > 0 && (
                                                    <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                                                        <Flame className="h-4 w-4 text-orange-500" />
                                                        <span className="text-sm font-bold text-orange-500">
                                                            {streak.currentStreak}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Points and Multiplier */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-medium text-slate-400">
                                                    {earnedPoints} pts
                                                </span>
                                                {streak.multiplier > 1.0 && (
                                                    <span className="text-sm font-semibold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                                                        {streak.multiplier}x multiplier
                                                    </span>
                                                )}
                                                {streak.hasShield && (
                                                    <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded">
                                                        <Shield className="h-4 w-4 text-emerald-500" />
                                                        <span className="text-sm font-medium text-emerald-500">
                                                            {streak.shieldActive ? 'Active' : 'Ready'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent History (7 days) */}
                                            <div className="flex items-center gap-1">
                                                {recentHistory.map((completed, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-5 h-5 rounded ${
                                                            completed ? 'bg-emerald-500' : 'bg-slate-700'
                                                        }`}
                                                        title={`Day ${idx - 6} ago`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {todaysHabits.length === 0 && (
                            <div className="text-center py-8 px-4 bg-slate-800 rounded-lg">
                                <p className="text-slate-400">No habits scheduled for today.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Milestones Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-100">Active Milestones</h2>
                        <button
                            onClick={() => router.push('/create-milestone')}
                            className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors text-sm font-medium text-white flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Milestone
                        </button>
                    </div>
                    {activeMilestones.length > 0 ? (
                        <div className="space-y-3">
                            {activeMilestones.map((milestone) => (
                                <div
                                    key={milestone.milestoneId}
                                    className="bg-slate-800 rounded-lg shadow-lg p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-500 rounded-full p-3">
                                            <Target className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-100">{milestone.name}</h3>
                                            {milestone.description && (
                                                <p className="text-sm text-slate-400">{milestone.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-orange-500">
                                                {getMilestonePoints(milestone.size)} pts
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-800 rounded-lg p-6 text-center">
                            <p className="text-slate-400">No active milestones. Create one to get started!</p>
                        </div>
                    )}
                </section>

                {/* Yesterday's Summary Section */}
                {yesterdayHabits.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Yesterday's Summary</h2>
                        <div className="space-y-3">
                            {yesterdayHabits.map(({ goal, template, entries, isCompleted, canCompleteToday, yesterdayDate, streak }) => (
                                <div
                                    key={goal.monthlyGoalId}
                                    className={`bg-slate-800 p-4 rounded-lg shadow-lg flex items-center justify-between ${
                                        canCompleteToday ? 'cursor-pointer transition-colors hover:bg-slate-700' : ''
                                    }`}
                                    onClick={() => canCompleteToday && handleHabitClick(goal, yesterdayDate, null)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{template?.icon || '⭐'}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-100">
                                                {template?.name || 'Unnamed Habit'}
                                                {canCompleteToday && (
                                                    <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">
                                                        Can complete today
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {isCompleted
                                                    ? `Completed: ${entries.map((e: any) => e.value).join(', ')}`
                                                    : canCompleteToday
                                                    ? 'Not completed - click to log'
                                                    : 'Not completed'}
                                            </p>
                                            {streak.currentStreak > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Flame className="h-4 w-4 text-orange-500" />
                                                    <span className="text-sm text-orange-500">{streak.currentStreak} day streak</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isCompleted ? 'bg-emerald-500' : canCompleteToday ? 'bg-orange-600' : 'bg-slate-700'
                                        }`}
                                    >
                                        {isCompleted && <span className="text-white font-bold">✓</span>}
                                        {canCompleteToday && !isCompleted && <span className="text-white font-bold">!</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Milestones */}
                {completedMilestones.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Completed Milestones</h2>
                        <div className="space-y-2">
                            {completedMilestones.slice(0, 3).map((milestone) => (
                                <div
                                    key={milestone.milestoneId}
                                    className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="text-sm text-slate-400 flex-1">{milestone.name}</span>
                                    <span className="text-sm font-semibold text-emerald-500">
                                        +{getMilestonePoints(milestone.size)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Habit Logging Dialog */}
            {selectedHabit && (
                <HabitLoggingDialog
                    isOpen={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                        setSelectedHabit(null);
                    }}
                    monthlyGoal={selectedHabit.goal}
                    targetDate={selectedHabit.targetDate}
                    existingEntry={selectedHabit.existingEntry}
                />
            )}
        </div>
    );
}
