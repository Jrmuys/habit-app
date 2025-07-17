'use client';

import { Fragment, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useRouter } from 'next/navigation';
import { Edit3, Calendar, Settings } from 'lucide-react';

export default function DashboardPage() {
    const { currentUserProfile, partnerProfile } = useProfile();
    const { habitTemplates, monthlyGoals, habitEntries } = useHabits();
    const router = useRouter();

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const todayDayOfWeek = new Date().getDay();

    // Process data to create weekly view
    const weeklyData = useMemo(() => {
        if (!currentUserProfile || !partnerProfile) return [];

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const currentDate = new Date();

        // Get last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().slice(0, 10); // YYYY-MM-DD format
        });

        const users = [
            {
                profile: currentUserProfile,
                initial: currentUserProfile.name.charAt(0).toUpperCase(),
            },
            {
                profile: partnerProfile,
                initial: partnerProfile.name.charAt(0).toUpperCase(),
            },
        ];

        return users.map((user, userIndex) => {
            const userGoals = monthlyGoals.filter(
                (goal) =>
                    goal.userId === user.profile.uid &&
                    goal.month === currentMonth
            );

            const days = last7Days.map((date) => {
                // Check if user has any completed habits for this date
                const dayEntries = habitEntries.filter(
                    (entry) =>
                        entry.userId === user.profile.uid &&
                        entry.targetDate === date
                );

                const dayGoals = userGoals.filter((goal) =>
                    dayEntries.some(
                        (entry) => entry.monthlyGoalId === goal.monthlyGoalId
                    )
                );

                // Simple completion check - if they have any entries for the day
                return dayEntries.length > 0;
            });

            return {
                user: user.initial,
                days,
                userIndex,
            };
        });
    }, [currentUserProfile, partnerProfile, monthlyGoals, habitEntries]);

    // Process yesterday's habits
    const yesterdayHabits = useMemo(() => {
        if (!currentUserProfile) return [];

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().slice(0, 10);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const userGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === currentUserProfile.uid &&
                goal.month === currentMonth
        );

        return userGoals.map((goal) => {
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
    }, [currentUserProfile, monthlyGoals, habitTemplates, habitEntries]);

    // Process today's habits
    const todayHabits = useMemo(() => {
        if (!currentUserProfile) return [];

        const todayDate = new Date().toISOString().slice(0, 10);
        const currentMonth = new Date().toISOString().slice(0, 7);

        const userGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === currentUserProfile.uid &&
                goal.month === currentMonth
        );

        return userGoals.map((goal) => {
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
    }, [currentUserProfile, monthlyGoals, habitTemplates, habitEntries]);

    const userName = currentUserProfile?.name || 'User';
    const userPoints = currentUserProfile?.points || 0;

    // Check if it's the last week of the month for "Plan Next Month" notification
    const today = new Date();
    const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
    );
    const daysUntilEndOfMonth = Math.ceil(
        (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const showPlanNextMonthBanner = daysUntilEndOfMonth <= 7;

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header Section */}
            <header className="p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-100">
                        {userName}'s Habits
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="text-slate-100 font-semibold">
                            {userPoints} Pts
                        </div>
                        <button
                            onClick={() => router.push('/edit-habits')}
                            className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit Habits"
                        >
                            <Edit3 size={20} />
                        </button>
                    </div>
                </div>

                {/* Plan Next Month Banner */}
                {showPlanNextMonthBanner && (
                    <div className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-white" size={24} />
                                <div>
                                    <h3 className="text-white font-semibold">
                                        Ready to plan for{' '}
                                        {new Date(
                                            today.getFullYear(),
                                            today.getMonth() + 1
                                        ).toLocaleDateString('en-US', {
                                            month: 'long',
                                        })}
                                        ?
                                    </h3>
                                    <p className="text-cyan-100 text-sm">
                                        Set up your habits for next month and
                                        stay on track!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/plan-next-month')}
                                className="px-4 py-2 bg-white text-cyan-600 font-medium rounded-lg hover:bg-cyan-50 transition-colors"
                            >
                                Plan Now
                            </button>
                        </div>
                    </div>
                )}
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

                        {/* User rows */}
                        {weeklyData.map((userData, userIndex) => (
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
                                            className={`w-6 h-6 rounded-full ${
                                                completed
                                                    ? userData.userIndex === 0
                                                        ? 'bg-emerald-500'
                                                        : 'bg-red-500'
                                                    : 'bg-slate-700'
                                            } ${
                                                dayIndex === todayDayOfWeek
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

                {/* Main Progress Bar */}
                <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold text-slate-100">
                            58%
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                            Overall Progress
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                        <div className="bg-emerald-500 h-3 rounded-full w-[58%]"></div>
                    </div>
                </div>

                {/* Yesterday Habits */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Yesterday
                    </h2>
                    <div className="space-y-4">
                        {yesterdayHabits.map((habit) => (
                            <div
                                key={habit.id}
                                className="bg-slate-800 rounded-lg p-4 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Circle */}
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            habit.completed
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
                        ))}
                    </div>
                </section>

                {/* Today Habits */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Today
                    </h2>
                    <div className="space-y-4">
                        {todayHabits.map((habit) => (
                            <div
                                key={habit.id}
                                className="bg-slate-800 rounded-lg p-4 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Circle */}
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            habit.status === 'complete'
                                                ? 'bg-emerald-500'
                                                : habit.status === 'partial'
                                                ? 'bg-orange-500 border-2 border-orange-500'
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
                                        {habit.status === 'partial' &&
                                            habit.icon && (
                                                <span className="text-white font-semibold">
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
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
