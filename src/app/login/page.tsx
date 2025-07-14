'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Import the new functions you need from the Firebase SDK
import {
   signInWithEmailAndPassword,
   GoogleAuthProvider, // The provider for Google
   signInWithPopup, // The function to open the popup
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function LoginPage() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const router = useRouter();

   // The email/password login function remains the same
   const handleLogin = async (e: React.FormEvent) => {
      // ... same as before
   };

   // --- NEW FUNCTION FOR GOOGLE LOGIN ---
   const handleGoogleLogin = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Create a new instance of the GoogleAuthProvider
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      try {
         // 2. Call signInWithPopup to trigger the Google login popup
         await signInWithPopup(auth, provider);

         // 3. If successful, the onAuthStateChanged listener will fire,
         //    and we can redirect to the dashboard.
         router.push('/dashboard');
      } catch (err: any) {
         setError('Failed to log in with Google.');
         console.error(err);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-center text-white">Login</h1>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-6">
               {/* ... email and password inputs ... */}
               {error && <p className="text-sm text-red-500">{error}</p>}
               <div>
                  <button
                     type="submit"
                     disabled={isLoading}
                     className="w-full py-3 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                  >
                     {isLoading ? 'Logging in...' : 'Login with Email'}
                  </button>
               </div>
            </form>

            <div className="relative flex items-center py-2">
               <div className="flex-grow border-t border-gray-600"></div>
               <span className="flex-shrink mx-4 text-gray-400">Or</span>
               <div className="flex-grow border-t border-gray-600"></div>
            </div>

            {/* --- NEW GOOGLE LOGIN BUTTON --- */}
            <div>
               <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 font-bold text-black bg-white rounded-md hover:bg-gray-200 disabled:bg-gray-400 transition-colors"
               >
                  {/* Simple Google Icon SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                     <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                     ></path>
                     <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                     ></path>
                     <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                     ></path>
                     <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                     ></path>
                     <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  Sign in with Google
               </button>
            </div>
         </div>
      </div>
   );
}
