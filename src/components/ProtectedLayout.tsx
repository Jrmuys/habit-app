'use client'; // This component MUST be a client component because it uses hooks.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use this from 'next/navigation' in App Router
import { useAuth } from '../hooks/useAuth';

// A simple loading component. You can make this more sophisticated.
function LoadingSpinner() {
   return (
      <div className="flex justify-center items-center h-screen">
         Loading...
      </div>
   );
}

export default function ProtectedLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const { user, loading } = useAuth();
   const router = useRouter();

   useEffect(() => {
      // We can't check for a user until the loading state is false.
      if (loading) {
         return;
      }

      // If there is no user, redirect to the login page.
      if (!user) {
         router.push('/login');
      }
   }, [user, loading, router]); // The effect depends on these values.

   // 1. While the auth state is loading, show a spinner.
   // This prevents a "flash" of the protected content before the redirect can happen.
   if (loading) {
      return <LoadingSpinner />;
   }

   // 2. If the user is authenticated, render the children (the actual page).
   if (user) {
      return <>{children}</>;
   }

   // 3. If loading is false and there's no user, the useEffect will trigger a redirect.
   // We return null here to render nothing while the redirect is in flight.
   return null;
}
