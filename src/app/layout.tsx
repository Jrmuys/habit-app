import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CalendarClock, Gift, Heart, House, Settings } from 'lucide-react';

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

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en">
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
         >
            {children}
            {/* Responsive Navigation Bar */}
            <div className="fixed bottom-0 left-0 z-50 w-full md:hidden">
               <div className="flex justify-around items-center h-16 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <a
                     href="/"
                     className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                     <CalendarClock />
                  </a>
                  <a
                     href="/"
                     className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                     <Gift />
                  </a>
                  <a
                     href="/"
                     className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                     <House />
                  </a>
                  <a
                     href="/habits"
                     className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                     <Heart />
                  </a>
                  <a
                     href="/about"
                     className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                     <Settings />
                  </a>
               </div>
            </div>
         </body>
      </html>
   );
}
