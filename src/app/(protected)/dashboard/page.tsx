'use client';

import { Fragment, useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useRouter } from 'next/navigation';
import { Edit3, Calendar, Settings, Check } from 'lucide-react';
import HabitLoggingDialog from '@/components/HabitLoggingDialog';
import { MonthlyGoal, ConstraintRule, HabitEntry } from '@/types';

// Helper component to display constraint information
const ConstraintInfo = ({ goal }: { goal: MonthlyGoal }) => {
    const { goal: goalRule, constraints } = goal;

    const renderGoal = () => {
        const { period, frequency } = goalRule;

        // Handle "every day" cases
        if (
            (period === 'DAILY' && frequency === 1) ||
            (period === 'WEEKLY' && frequency === 7)
        ) {
            let text = 'Every day';
            if (goalRule.targetValue) {
                text += `, ${goalRule.targetValue.operator
                    .toLowerCase()
                    .replace('_', ' ')} `;
                const valueSpan = `<span class="text-orange-400">${goalRule.targetValue.value}</span>`;
                return { __html: text + valueSpan };
            }
            return { __html: text };
        }

        // Handle regular frequency cases
        let timeText = frequency === 1 ? 'time' : 'times';
        let periodText = period.toLowerCase().replace('ly', ''); // daily -> day, weekly -> week, monthly -> month

        const freqSpan = `<span class="text-orange-400">${frequency}</span>`;
        let text = `${freqSpan} ${timeText} per ${periodText}`;

        if (goalRule.targetValue) {
            text += `, ${goalRule.targetValue.operator
                .toLowerCase()
                .replace('_', ' ')} `;
            const valueSpan = `<span class="text-orange-400">${goalRule.targetValue.value}</span>`;
            text += valueSpan;
        }

        return { __html: text };
    };

    const renderConstraints = () => {
        return constraints
            .map((c: ConstraintRule, i: number) => {
                if (c.type === 'GRACE_DAYS') {
                    const allowanceText = c.allowance === 1 ? 'day' : 'days';
                    const periodText = c.period.toLowerCase().replace('ly', '');
                    const allowanceSpan = `<span class="text-orange-400">${c.allowance}</span>`;
                    return {
                        __html: `${allowanceSpan} grace ${allowanceText} per ${periodText}`,
                    };
                }

                if (c.type === 'VALUE_FREQUENCY') {
                    const timeText = c.frequency === 1 ? 'time' : 'times';
                    const periodText = c.period.toLowerCase().replace('ly', '');
                    const operatorText = c.targetValue.operator
                        .toLowerCase()
                        .replace('_', ' ');
                    const freqSpan = `<span class="text-orange-400">${c.frequency}</span>`;
                    const valueSpan = `<span class="text-orange-400">${c.targetValue.value}</span>`;
                    return {
                        __html: `${freqSpan} ${timeText} per ${periodText} must be ${operatorText} ${valueSpan}`,
                    };
                }

                return null;
            })
            .filter((item): item is { __html: string } => item !== null);
    };

    const goalText = renderGoal();
    const constraintTexts = renderConstraints();

    return (
        <div className="text-xs text-slate-400 mt-1">
            <p dangerouslySetInnerHTML={goalText}></p>
            {constraintTexts.map((text, i) => (
                <p
                    key={i}
                    className="text-slate-500"
                    dangerouslySetInnerHTML={text}
                ></p>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const { currentUserProfile, partnerProfile, isSingleUser } = useProfile();
    const { habitTemplates, monthlyGoals, habitEntries, logHabitEntry } =
        useHabits();
    const router = useRouter();

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<{
        goal: MonthlyGoal;
        targetDate: string;
        existingEntry: any;
    } | null>(null);

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const todayDayOfWeek = new Date().getDay();

    // Handle habit click
    const handleHabitClick = async (
        goal: MonthlyGoal,
        targetDate: string,
        existingEntry: any
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

    const todaysHabits = useMemo(() => {
        if (!currentUserProfile) return [];

        const today = new Date().toISOString().slice(0, 10);
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
            const entry = habitEntries.find(
                (e) =>
                    e.monthlyGoalId === goal.monthlyGoalId &&
                    e.targetDate === today
            );

            return {
                goal,
                template,
                entry,
                today,
            };
        });
    }, [currentUserProfile, monthlyGoals, habitTemplates, habitEntries]);

    // Process data to create weekly view
    const weeklyData = useMemo(() => {
        if (!currentUserProfile) return [];
        const usersToShow = [currentUserProfile];
        if (partnerProfile) {
            usersToShow.push(partnerProfile);
        }

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const currentDate = new Date();

        // Get last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().slice(0, 10); // YYYY-MM-DD format
        });

        const users = usersToShow.map((profile) => ({
            profile,
            initial: profile.name.charAt(0).toUpperCase(),
        }));

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
                goal,
                template,
                entries,
                isCompleted: entries.length > 0,
                canCompleteToday:
                    goal.logging.allowNextDayCompletion && entries.length === 0, // Can complete today if allowed and not already done
                yesterdayDate, // Pass the date for completion
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

    if (!currentUserProfile || (!partnerProfile && !isSingleUser)) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <header className="p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-cyan-400">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/edit-habits')}
                        className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <Edit3 className="h-6 w-6 text-slate-400" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <Calendar className="h-6 w-6 text-slate-400" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <Settings className="h-6 w-6 text-slate-400" />
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-8">
                {/* Weekly Progress Section */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-300 mb-4">
                        Weekly Progress
                    </h2>
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
                                    {userData.days.map(
                                        (completed, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                className="flex justify-center"
                                            >
                                                <div
                                                    className={`w-6 h-6 rounded-full ${
                                                        completed
                                                            ? userData.userIndex ===
                                                              0
                                                                ? 'bg-emerald-500'
                                                                : 'bg-red-500'
                                                            : 'bg-slate-700'
                                                    } ${
                                                        dayIndex ===
                                                        todayDayOfWeek
                                                            ? 'ring-2 ring-teal-500'
                                                            : ''
                                                    }`}
                                                />
                                            </div>
                                        )
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Yesterday's Summary Section */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-300 mb-4">
                        Yesterday's Summary
                    </h2>
                    <div className="space-y-4">
                        {yesterdayHabits.map(
                            ({
                                goal,
                                template,
                                entries,
                                isCompleted,
                                canCompleteToday,
                                yesterdayDate,
                            }) => (
                                <div
                                    key={goal.monthlyGoalId}
                                    className={`bg-slate-800 p-4 rounded-lg shadow-lg flex items-center justify-between ${
                                        canCompleteToday
                                            ? 'cursor-pointer transition-colors hover:bg-slate-700'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        canCompleteToday &&
                                        handleHabitClick(
                                            goal,
                                            yesterdayDate,
                                            null
                                        )
                                    }
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">
                                            {template?.icon}
                                        </span>
                                        <div>
                                            <h3 className="font-bold text-slate-100">
                                                {template?.name}
                                                {canCompleteToday && (
                                                    <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">
                                                        Can complete today
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {isCompleted
                                                    ? `Completed: ${entries
                                                          .map(
                                                              (e: HabitEntry) =>
                                                                  e.value
                                                          )
                                                          .join(', ')}`
                                                    : canCompleteToday
                                                    ? 'Not completed - click to log'
                                                    : 'Not completed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isCompleted
                                                ? 'bg-emerald-500'
                                                : canCompleteToday
                                                ? 'bg-orange-600'
                                                : 'bg-slate-700'
                                        }`}
                                    >
                                        {isCompleted && (
                                            <span className="text-white font-bold">
                                                ✓
                                            </span>
                                        )}
                                        {canCompleteToday && !isCompleted && (
                                            <span className="text-white font-bold">
                                                !
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                        {yesterdayHabits.length === 0 && (
                            <div className="text-center py-8 px-4 bg-slate-800 rounded-lg">
                                <p className="text-slate-400">
                                    Nothing was scheduled for yesterday.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Today's Habits Section */}
                <section>
                    <h2 className="text-xl font-semibold text-slate-300 mb-4">
                        Today's Habits
                    </h2>
                    <div className="space-y-4">
                        {todaysHabits.map(
                            ({ goal, template, entry, today }) => (
                                <div
                                    key={goal.monthlyGoalId}
                                    className="bg-slate-800 p-4 rounded-lg shadow-lg cursor-pointer transition-colors hover:bg-slate-700"
                                    onClick={() =>
                                        handleHabitClick(goal, today, entry)
                                    }
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Circle */}
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                entry
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-700'
                                            }`}
                                        >
                                            {entry && (
                                                <Check className="h-6 w-6 text-white" />
                                            )}
                                        </div>

                                        {/* Habit Icon */}
                                        <span className="text-3xl">
                                            {template?.icon}
                                        </span>

                                        {/* Habit Details */}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-100">
                                                {template?.name}
                                            </h3>
                                            <ConstraintInfo goal={goal} />
                                        </div>

                                        {/* Logged Value Display */}
                                        {entry && (
                                            <div className="text-right">
                                                <span className="text-emerald-400 font-semibold text-sm">
                                                    Logged: {entry.value}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                        {todaysHabits.length === 0 && (
                            <div className="text-center py-8 px-4 bg-slate-800 rounded-lg">
                                <p className="text-slate-400">
                                    No habits scheduled for today.
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    You can add monthly goals from the 'Edit
                                    Habits' page.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
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
