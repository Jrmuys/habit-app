import { getAnalytics } from "firebase/analytics";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG during build
let firebaseConfig: any;

// Debug logging for environment variables
console.log('🔧 Firebase Config Debug:');
console.log('- FIREBASE_WEBAPP_CONFIG exists:', !!process.env.FIREBASE_WEBAPP_CONFIG);
console.log('- NEXT_PUBLIC_FIREBASE_API_KEY exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- typeof window:', typeof window);

if (process.env.FIREBASE_WEBAPP_CONFIG) {
    // Firebase App Hosting config (preferred)
    console.log('✅ Using FIREBASE_WEBAPP_CONFIG');
    try {
        firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
        console.log('- Project ID:', firebaseConfig.projectId);
        console.log('- API Key exists:', !!firebaseConfig.apiKey);
    } catch (error) {
        console.error('❌ Error parsing FIREBASE_WEBAPP_CONFIG:', error);
        firebaseConfig = {
            apiKey: 'dummy-api-key',
            authDomain: 'dummy.firebaseapp.com',
            projectId: 'dummy-project',
            storageBucket: 'dummy-project.appspot.com',
            messagingSenderId: '123456789',
            appId: '1:123456789:web:dummy',
        };
    }
} else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    // Manual environment variables
    console.log('✅ Using NEXT_PUBLIC_FIREBASE_* variables');
    firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    console.log('- Project ID:', firebaseConfig.projectId);
} else {
    // Fallback config for build time
    console.log('⚠️ Using fallback dummy config');
    firebaseConfig = {
        apiKey: 'dummy-api-key',
        authDomain: 'dummy.firebaseapp.com',
        projectId: 'dummy-project',
        storageBucket: 'dummy-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:dummy',
    };
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { auth, db, app, analytics };