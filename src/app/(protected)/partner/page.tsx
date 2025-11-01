'use client';

import { Fragment, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';

export default function PartnerPage() {
    const { partnerProfile } = useProfile();
    const {
        habitTemplates,
        monthlyGoals,
        habitEntries,
    } = useHabits(partnerProfile?.uid);

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();

    // Process data to create weekly view for partner
    const partnerWeeklyData = useMemo(() => {
        if (!partnerProfile) return [];

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const currentDate = new Date();

        // Get last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().slice(0, 10); // YYYY-MM-DD format
        });

        const partnerGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === partnerProfile.uid &&
                goal.month === currentMonth
        );

        const days = last7Days.map((date) => {
            // Check if partner has any completed habits for this date
            const dayEntries = habitEntries.filter(
                (entry) =>
                    entry.userId === partnerProfile.uid &&
                    entry.targetDate === date
            );

            // Simple completion check - if they have any entries for the day
            return dayEntries.length > 0;
        });

        return [
            {
                user: partnerProfile.name.charAt(0).toUpperCase(),
                days,
                userIndex: 1, // Use index 1 for partner color (red)
            },
        ];
    }, [partnerProfile, monthlyGoals, habitEntries]);

    // Process partner's yesterday's habits
    const partnerYesterdayHabits = useMemo(() => {
        if (!partnerProfile) return [];

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().slice(0, 10);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const partnerGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === partnerProfile.uid &&
                goal.month === currentMonth
        );

        return partnerGoals.map((goal) => {
            const template = habitTemplates.find(
                (t) => t.habitId === goal.habitId
            );
            const entries = habitEntries.filter(
                (entry) =>
                    entry.monthlyGoalId === goal.monthlyGoalId &&
                    entry.targetDate === yesterdayDate
            );

            return {
                id: goal.monthlyGoalId,
                name: template?.name || 'Unknown Habit',
                description: template?.description || '',
                completed: entries.length > 0,
                status: entries.length > 0 ? 'complete' : 'incomplete',
            };
        });
    }, [partnerProfile, monthlyGoals, habitTemplates, habitEntries]);

    // Process partner's today's habits
    const partnerTodayHabits = useMemo(() => {
        if (!partnerProfile) return [];

        const todayDate = new Date().toISOString().slice(0, 10);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const partnerGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === partnerProfile.uid &&
                goal.month === currentMonth
        );

        return partnerGoals.map((goal) => {
            const template = habitTemplates.find(
                (t) => t.habitId === goal.habitId
            );
            const entries = habitEntries.filter(
                (entry) =>
                    entry.monthlyGoalId === goal.monthlyGoalId &&
                    entry.targetDate === todayDate
            );

            const completed = entries.length > 0;

            return {
                id: goal.monthlyGoalId,
                name: template?.name || 'Unknown Habit',
                description: template?.description || '',
                completed,
                status: completed ? 'complete' : 'incomplete',
                icon: template?.icon,
            };
        });
    }, [partnerProfile, monthlyGoals, habitTemplates, habitEntries]);

    if (!partnerProfile) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-slate-400">No partner profile found</div>
            </div>
        );
    }

    const partnerName = partnerProfile.name || 'Partner';
    const partnerPoints = partnerProfile.points || 0;

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header Section */}
            <header className="p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-100">
                        {partnerName}'s Habits
                    </h1>
                    <div className="text-slate-100 font-semibold">
                        {partnerPoints} Pts
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 space-y-6">
                {/* Weekly Progress View */}
                <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                    <div className="grid grid-cols-8 gap-2 items-center">
                        {/* Empty cell for alignment with user initials column */}
                        <div></div>

                        {/* Day headers */}
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(
                            (day, index) => (
                                <div
                                    key={index}
                                    className="text-center text-sm font-medium text-slate-400"
                                >
                                    {day}
                                </div>
                            )
                        )}

                        {/* Partner row */}
                        {partnerWeeklyData.map((userData, userIndex) => (
                            <Fragment key={userIndex}>
                                {/* User initial */}
                                <div className="text-sm font-medium text-slate-400 text-center">
                                    {userData.user}
                                </div>

                                {/* Daily status circles */}
                                {userData.days.map((completed, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className="flex justify-center"
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full ${completed
                                                    ? 'bg-red-500'
                                                    : 'bg-slate-700'
                                                } ${dayIndex === today
                                                    ? 'ring-2 ring-teal-500'
                                                    : ''
                                                }`}
                                        />
                                    </div>
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>

                {/* Yesterday Habits */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Yesterday
                    </h2>
                    <div className="space-y-4">
                        {partnerYesterdayHabits.length === 0 ? (
                            <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                                <div className="text-center text-slate-400">
                                    No habits for yesterday
                                </div>
                            </div>
                        ) : (
                            partnerYesterdayHabits.map((habit) => (
                                <div
                                    key={habit.id}
                                    className="bg-slate-800 rounded-lg p-4 shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Circle */}
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${habit.completed
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-700'
                                                }`}
                                        >
                                            {habit.completed && (
                                                <svg
                                                    className="w-6 h-6 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Habit Details */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-100">
                                                {habit.name}
                                            </h3>
                                            <p className="text-base font-normal text-slate-400">
                                                {habit.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Today Habits */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Today
                    </h2>
                    <div className="space-y-4">
                        {partnerTodayHabits.length === 0 ? (
                            <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                                <div className="text-center text-slate-400">
                                    No habits for today
                                </div>
                            </div>
                        ) : (
                            partnerTodayHabits.map((habit) => (
                                <div
                                    key={habit.id}
                                    className="bg-slate-800 rounded-lg p-4 shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Circle */}
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${habit.status === 'complete'
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-700'
                                                }`}
                                        >
                                            {habit.status === 'complete' && (
                                                <svg
                                                    className="w-6 h-6 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                            {habit.icon && !habit.completed && (
                                                <span className="text-slate-400 font-semibold">
                                                    {habit.icon}
                                                </span>
                                            )}
                                        </div>

                                        {/* Habit Details */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-100">
                                                {habit.name}
                                            </h3>
                                            <p className="text-base font-normal text-slate-400">
                                                {habit.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
