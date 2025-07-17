'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function Loading() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500">Loading...</div>
        </div>
    );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Define routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        if (loading) {
            return;
        }

        // Redirect authenticated users away from public routes to dashboard
        if (user && isPublicRoute) {
            router.push('/dashboard');
            return;
        }

        // Redirect unauthenticated users to login
        if (!user && !isPublicRoute) {
            router.push('/login');
        }
    }, [user, loading, router, isPublicRoute]);

    if (loading) {
        return <Loading />;
    }

    // Don't render anything while redirecting
    if (user && isPublicRoute) {
        return null;
    }

    // Allow public routes to render for unauthenticated users
    if (!user && isPublicRoute) {
        return <>{children}</>;
    }

    // Block protected routes if no user
    if (!user && !isPublicRoute) {
        return null;
    }

    return <>{children}</>;
}
