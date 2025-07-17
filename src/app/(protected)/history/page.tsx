'use client';

import { useState, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

// Daily Summary Modal Component
function DailySummaryModal({
    isOpen,
    onClose,
    selectedDate,
    dayHabits,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string | null;
    dayHabits: Array<{
        id: string;
        name: string;
        description: string;
        completed: boolean;
        status: 'complete' | 'incomplete';
    }>;
}) {
    if (!isOpen || !selectedDate) return null;

    const date = new Date(selectedDate);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                        {formattedDate}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-3">
                    {dayHabits.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                            No habits for this day
                        </div>
                    ) : (
                        dayHabits.map((habit) => (
                            <div
                                key={habit.id}
                                className="bg-slate-700 rounded-lg p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            habit.completed
                                                ? 'bg-emerald-500'
                                                : 'bg-slate-600'
                                        }`}
                                    >
                                        {habit.completed && (
                                            <svg
                                                className="w-4 h-4 text-white"
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
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-100">
                                            {habit.name}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {habit.completed
                                                ? 'Completed'
                                                : 'Missed'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HistoryPage() {
    const { currentUserProfile } = useProfile();
    const { habitTemplates, monthlyGoals, habitEntries } = useHabits();

    // Current date for default selection
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-based

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Generate years (current year and previous 2 years)
    const availableYears = useMemo(() => {
        const years = [];
        for (let i = 0; i < 3; i++) {
            years.push(currentDate.getFullYear() - i);
        }
        return years;
    }, [currentDate]);

    // Month names
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    // Process calendar data for selected month
    const calendarData = useMemo(() => {
        if (!currentUserProfile) return { days: [], totalDays: 0 };

        const selectedMonthStr = `${selectedYear}-${(selectedMonth + 1)
            .toString()
            .padStart(2, '0')}`;

        // Get user's monthly goals for selected month
        const userMonthlyGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === currentUserProfile.uid &&
                goal.month === selectedMonthStr
        );

        // Get all days in the selected month
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Get start of calendar (might include days from previous month)
        const startOfCalendar = new Date(firstDay);
        startOfCalendar.setDate(startOfCalendar.getDate() - firstDay.getDay());

        // Generate 42 days (6 weeks) for calendar grid
        const days = [];
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startOfCalendar);
            currentDay.setDate(currentDay.getDate() + i);

            const dateStr = currentDay.toISOString().slice(0, 10);
            const isCurrentMonth = currentDay.getMonth() === selectedMonth;
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            // Calculate completion for this day
            let completionStatus: 'complete' | 'partial' | 'missed' = 'missed';

            if (isCurrentMonth && userMonthlyGoals.length > 0) {
                const dayEntries = habitEntries.filter(
                    (entry) =>
                        entry.userId === currentUserProfile.uid &&
                        entry.targetDate === dateStr
                );

                const completedGoals = userMonthlyGoals.filter((goal) =>
                    dayEntries.some(
                        (entry) => entry.monthlyGoalId === goal.monthlyGoalId
                    )
                );

                if (completedGoals.length === userMonthlyGoals.length) {
                    completionStatus = 'complete';
                } else if (completedGoals.length > 0) {
                    completionStatus = 'partial';
                }
            }

            days.push({
                date: currentDay,
                dateStr,
                dayNumber: currentDay.getDate(),
                isCurrentMonth,
                isToday,
                completionStatus,
            });
        }

        return { days, totalDays };
    }, [
        selectedYear,
        selectedMonth,
        currentUserProfile,
        monthlyGoals,
        habitEntries,
    ]);

    // Get habits for selected day (for modal)
    const selectedDayHabits = useMemo(() => {
        if (!selectedDate || !currentUserProfile) return [];

        const selectedMonthStr = `${selectedYear}-${(selectedMonth + 1)
            .toString()
            .padStart(2, '0')}`;

        const userMonthlyGoals = monthlyGoals.filter(
            (goal) =>
                goal.userId === currentUserProfile.uid &&
                goal.month === selectedMonthStr
        );

        return userMonthlyGoals.map((goal) => {
            const template = habitTemplates.find(
                (t) => t.habitId === goal.habitId
            );
            const entries = habitEntries.filter(
                (entry) =>
                    entry.monthlyGoalId === goal.monthlyGoalId &&
                    entry.targetDate === selectedDate
            );

            const completed = entries.length > 0;

            return {
                id: goal.monthlyGoalId,
                name: template?.name || 'Unknown Habit',
                description: template?.description || '',
                completed,
                status: completed
                    ? ('complete' as const)
                    : ('incomplete' as const),
            };
        });
    }, [
        selectedDate,
        selectedYear,
        selectedMonth,
        currentUserProfile,
        monthlyGoals,
        habitTemplates,
        habitEntries,
    ]);

    const handleDayClick = (day: (typeof calendarData.days)[0]) => {
        if (day.isCurrentMonth) {
            setSelectedDate(day.dateStr);
            setModalOpen(true);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            } else {
                setSelectedMonth(selectedMonth - 1);
            }
        } else {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            } else {
                setSelectedMonth(selectedMonth + 1);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header Section */}
            <header className="p-6">
                <h1 className="text-3xl font-bold text-slate-100 mb-6">
                    History
                </h1>

                {/* Month & Year Selector */}
                <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(parseInt(e.target.value))
                                }
                                className="bg-slate-700 border border-slate-600 text-slate-100 text-base rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                {monthNames.map((month, index) => (
                                    <option key={index} value={index}>
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(parseInt(e.target.value))
                                }
                                className="bg-slate-700 border border-slate-600 text-slate-100 text-base rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                {/* Calendar View */}
                <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-slate-400 p-2"
                                >
                                    {day}
                                </div>
                            )
                        )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarData.days.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => handleDayClick(day)}
                                disabled={!day.isCurrentMonth}
                                className={`
                                    aspect-square p-2 rounded-lg text-sm font-medium transition-colors
                                    ${
                                        day.isCurrentMonth
                                            ? 'text-slate-100 hover:bg-slate-700 cursor-pointer'
                                            : 'text-slate-600 cursor-not-allowed'
                                    }
                                    ${
                                        day.isToday && day.isCurrentMonth
                                            ? 'ring-2 ring-cyan-500'
                                            : ''
                                    }
                                    ${
                                        day.isCurrentMonth &&
                                        day.completionStatus === 'complete'
                                            ? 'bg-emerald-500 hover:bg-emerald-600'
                                            : day.isCurrentMonth &&
                                              day.completionStatus === 'partial'
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : day.isCurrentMonth
                                            ? 'bg-slate-700'
                                            : 'bg-slate-800'
                                    }
                                `}
                            >
                                {day.dayNumber}
                            </button>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-500"></div>
                            <span className="text-sm text-slate-400">
                                Complete
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500"></div>
                            <span className="text-sm text-slate-400">
                                Partial
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-slate-700"></div>
                            <span className="text-sm text-slate-400">
                                Missed
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Daily Summary Modal */}
            <DailySummaryModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                selectedDate={selectedDate}
                dayHabits={selectedDayHabits}
            />
        </div>
    );
}
