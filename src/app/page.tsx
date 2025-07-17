import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="px-6 py-4">
                <nav className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="text-2xl font-bold text-indigo-600">
                        Hoel Habits
                    </div>
                    <div className="space-x-4">
                        <Link
                            href="/login"
                            className="text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Sign Up
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Welcome to{' '}
                        <span className="text-indigo-600">Hoel Habits</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Your personal habit tracking application. Build better
                        habits, track your progress, and achieve your goals with
                        our intuitive and powerful platform.
                    </p>

                    {/* CTA Buttons */}
                    <div className="space-x-4">
                        <Link
                            href="/login"
                            className="inline-block bg-indigo-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/register"
                            className="inline-block bg-white text-indigo-600 text-lg px-8 py-4 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-6xl mx-auto mt-20">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Track Progress
                            </h3>
                            <p className="text-gray-600">
                                Monitor your habits with detailed analytics and
                                visual progress tracking.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Flexible Goals
                            </h3>
                            <p className="text-gray-600">
                                Set daily, weekly, or monthly goals that adapt
                                to your lifestyle.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Stay Motivated
                            </h3>
                            <p className="text-gray-600">
                                Get insights and encouragement to maintain your
                                habit streaks.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
