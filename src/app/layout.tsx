import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CalendarClock, Gift, Heart, House, Settings } from 'lucide-react';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

export const metadata: Metadata = {
   title: 'Hoel Habits',
   description: 'A habit tracking application',
};

function Loading() {
   return (
      <div className="flex items-center justify-center h-screen">
         <div className="text-gray-500">Loading...</div>
      </div>
   );
}

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   const { user, loading } = useAuth();
   const router = useRouter();

   useEffect(() => {
      if (loading) {
         return;
      }

      if (!user) {
         router.push('/login');
      }
   }, [user, loading, router]);
   if (loading) {
      return <Loading />;
   }
   if (user) {
      return (
         <AuthProvider>
            <html lang="en">
               <body
                  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
               >
                  {children}
               </body>
            </html>
         </AuthProvider>
      );
   }
   return null;
}
