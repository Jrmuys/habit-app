import { useAuth } from '@/hooks/useAuth';
import { CalendarClock, Gift, Heart, House, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return <div>Loading...</div>;
    }

    const isActive = (href: string) => pathname === href;

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full md:hidden">
            <div className="flex justify-around items-center h-16 bg-slate-800 border-t border-slate-700">
                <Link
                    href="/history"
                    className={`flex flex-col items-center transition-colors ${
                        isActive('/history')
                            ? 'text-cyan-500'
                            : 'text-slate-400 hover:text-cyan-500'
                    }`}
                >
                    <CalendarClock size={20} />
                </Link>
                <Link
                    href="/rewards"
                    className={`flex flex-col items-center transition-colors ${
                        isActive('/rewards')
                            ? 'text-cyan-500'
                            : 'text-slate-400 hover:text-cyan-500'
                    }`}
                >
                    <Gift size={20} />
                </Link>
                <Link
                    href="/dashboard"
                    className={`flex flex-col items-center transition-colors ${
                        isActive('/dashboard')
                            ? 'text-cyan-500'
                            : 'text-slate-400 hover:text-cyan-500'
                    }`}
                >
                    <House size={20} />
                </Link>
                <Link
                    href="/partner"
                    className={`flex flex-col items-center transition-colors ${
                        isActive('/partner')
                            ? 'text-cyan-500'
                            : 'text-slate-400 hover:text-cyan-500'
                    }`}
                >
                    <Heart size={20} />
                </Link>
                <Link
                    href="/settings"
                    className={`flex flex-col items-center transition-colors ${
                        isActive('/settings')
                            ? 'text-cyan-500'
                            : 'text-slate-400 hover:text-cyan-500'
                    }`}
                >
                    <Settings size={20} />
                </Link>
            </div>
        </div>
    );
}
