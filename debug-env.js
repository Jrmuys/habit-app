// Debug script to check environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
console.log(
    'FIREBASE_WEBAPP_CONFIG exists:',
    !!process.env.FIREBASE_WEBAPP_CONFIG
);
console.log('FIREBASE_CONFIG exists:', !!process.env.FIREBASE_CONFIG);

// Check Firebase App Hosting specific vars
if (process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
        const config = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
        console.log('FIREBASE_WEBAPP_CONFIG keys:', Object.keys(config));
        console.log('FIREBASE_WEBAPP_CONFIG projectId:', config.projectId);
        console.log('FIREBASE_WEBAPP_CONFIG apiKey exists:', !!config.apiKey);
    } catch (e) {
        console.log('Error parsing FIREBASE_WEBAPP_CONFIG:', e.message);
    }
}

// Check manual env vars
console.log(
    'NEXT_PUBLIC_FIREBASE_API_KEY exists:',
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
);
console.log(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID:',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Check all environment variables that start with FIREBASE
console.log('\n=== All FIREBASE env vars ===');
Object.keys(process.env)
    .filter((key) => key.includes('FIREBASE'))
    .forEach((key) => {
        console.log(`${key}:`, process.env[key] ? 'EXISTS' : 'UNDEFINED');
    });

console.log('\n=== All NEXT_PUBLIC env vars ===');
Object.keys(process.env)
    .filter((key) => key.startsWith('NEXT_PUBLIC_'))
    .forEach((key) => {
        console.log(`${key}:`, process.env[key] ? 'EXISTS' : 'UNDEFINED');
    });
