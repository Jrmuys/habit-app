'use client';

import { useProfile } from '@/hooks/useProfile';
import { useActivityLog } from '@/hooks/useActivityLog';
import {
    Calendar,
    Gift,
    Target,
    Award,
    ArrowLeft,
    FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActivityLogEntry } from '@/types/misc';

export default function ActivityLogPage() {
    const { currentUserProfile } = useProfile();
    const { activityLog, loading } = useActivityLog();
    const router = useRouter();

    const getActivityIcon = (text: string) => {
        if (
            text.toLowerCase().includes('habit') ||
            text.toLowerCase().includes('completed')
        ) {
            return <Target className="text-emerald-500" size={20} />;
        } else if (
            text.toLowerCase().includes('reward') ||
            text.toLowerCase().includes('redeem')
        ) {
            return <Gift className="text-orange-500" size={20} />;
        } else if (
            text.toLowerCase().includes('milestone') ||
            text.toLowerCase().includes('achievement')
        ) {
            return <Award className="text-cyan-500" size={20} />;
        } else {
            return <Calendar className="text-slate-400" size={20} />;
        }
    };

    const getActivityDescription = (activity: ActivityLogEntry) => {
        return activity.text;
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })}`;
        } else if (diffDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })}`;
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year:
                    date.getFullYear() !== now.getFullYear()
                        ? 'numeric'
                        : undefined,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
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
                        Activity Log
                    </h1>
                </div>
            </header>

            <main className="p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activityLog.length === 0 ? (
                    <div className="bg-slate-800 rounded-lg p-8 text-center">
                        <FileText
                            className="mx-auto text-slate-400 mb-4"
                            size={48}
                        />
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">
                            No Activity Yet
                        </h3>
                        <p className="text-slate-400">
                            Your activity history will appear here as you
                            complete habits and redeem rewards.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activityLog.map((activity) => (
                            <div
                                key={activity.logEntryId}
                                className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {getActivityIcon(activity.text)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-100 font-medium">
                                            {getActivityDescription(activity)}
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {formatDate(activity.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
