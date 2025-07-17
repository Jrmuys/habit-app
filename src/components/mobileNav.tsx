import { useAuth } from '@/hooks/useAuth';
import { CalendarClock, Gift, Heart, House, Settings } from 'lucide-react';

export default function MobileNav() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full md:hidden">
            <div className="flex justify-around items-center h-16 bg-slate-800 border-t border-slate-700">
                <a
                    href="/history"
                    className="flex flex-col items-center text-slate-400 hover:text-cyan-500 transition-colors"
                >
                    <CalendarClock size={20} />
                </a>
                <a
                    href="/rewards"
                    className="flex flex-col items-center text-slate-400 hover:text-cyan-500 transition-colors"
                >
                    <Gift size={20} />
                </a>
                <a
                    href="/dashboard"
                    className="flex flex-col items-center text-cyan-500"
                >
                    <House size={20} />
                </a>
                <a
                    href="/partner"
                    className="flex flex-col items-center text-slate-400 hover:text-cyan-500 transition-colors"
                >
                    <Heart size={20} />
                </a>
                <a
                    href="/settings"
                    className="flex flex-col items-center text-slate-400 hover:text-cyan-500 transition-colors"
                >
                    <Settings size={20} />
                </a>
            </div>
        </div>
    );
}
