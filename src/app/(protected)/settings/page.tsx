'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import {
    User,
    Bell,
    Users,
    Activity,
    LogOut,
    Unlink,
    Copy,
    Check,
    AlertTriangle,
    X,
    Link,
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Confirmation Modal Component
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    isDestructive = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-red-500" size={24} />
                    <h3 className="text-lg font-semibold text-slate-100">
                        {title}
                    </h3>
                </div>

                <p className="text-slate-300 mb-6">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                            isDestructive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-cyan-600 text-white hover:bg-cyan-700'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { currentUserProfile, partnerProfile, refreshProfiles } =
        useProfile();
    const router = useRouter();

    // Form states
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Notification preferences (stored locally for now)
    const [dailyReminder, setDailyReminder] = useState(true);
    const [partnerPerfectWeek, setPartnerPerfectWeek] = useState(true);
    const [partnerStreaks, setPartnerStreaks] = useState(true);
    const [partnerMilestones, setPartnerMilestones] = useState(true);

    // Modal states
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);

    // Couple code copy state
    const [codeCopied, setCodeCopied] = useState(false);

    // Partner linking states
    const [partnerCode, setPartnerCode] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [linkingError, setLinkingError] = useState('');
    const [linkingSuccess, setLinkingSuccess] = useState(false);

    // Initialize display name
    useEffect(() => {
        if (currentUserProfile?.name) {
            setDisplayName(currentUserProfile.name);
        }
    }, [currentUserProfile?.name]);

    // Load notification preferences from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                setDailyReminder(prefs.dailyReminder ?? true);
                setPartnerPerfectWeek(prefs.partnerPerfectWeek ?? true);
                setPartnerStreaks(prefs.partnerStreaks ?? true);
                setPartnerMilestones(prefs.partnerMilestones ?? true);
            } catch (error) {
                console.error('Error loading notification preferences:', error);
            }
        }
    }, []);

    // Save notification preferences to localStorage
    const saveNotificationPreferences = () => {
        const prefs = {
            dailyReminder,
            partnerPerfectWeek,
            partnerStreaks,
            partnerMilestones,
        };
        localStorage.setItem('notificationPreferences', JSON.stringify(prefs));
    };

    // Update notification preference and save
    const updateNotificationPref = (
        setter: (value: boolean) => void,
        value: boolean
    ) => {
        setter(value);
        // Save after a brief delay to allow state to update
        setTimeout(saveNotificationPreferences, 100);
    };

    const handleSaveProfile = async () => {
        if (!user || !currentUserProfile || !displayName.trim()) return;

        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                name: displayName.trim(),
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            // Refresh profiles to get updated data
            await refreshProfiles();
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnlinkPartner = async () => {
        if (!user || !currentUserProfile?.coupleId) return;

        setIsUnlinking(true);
        try {
            // Delete the couple document
            const coupleDocRef = doc(
                db,
                'couples',
                currentUserProfile.coupleId
            );
            await deleteDoc(coupleDocRef);

            // Update current user to remove coupleId
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                coupleId: null,
            });

            // Update partner to remove coupleId (if partner exists)
            if (partnerProfile) {
                const partnerDocRef = doc(db, 'users', partnerProfile.uid);
                await updateDoc(partnerDocRef, {
                    coupleId: null,
                });
            }

            // Refresh profiles
            await refreshProfiles();

            setShowUnlinkModal(false);
        } catch (error) {
            console.error('Error unlinking partner:', error);
        } finally {
            setIsUnlinking(false);
        }
    };

    const handleLinkPartner = async () => {
        if (!user || !currentUserProfile || !partnerCode.trim()) return;

        setIsLinking(true);
        setLinkingError('');
        setLinkingSuccess(false);

        try {
            // Check if user is trying to link to themselves
            if (partnerCode.trim() === user.uid) {
                setLinkingError('You cannot link to yourself.');
                return;
            }

            // Try to get partner document
            const partnerDocRef = doc(db, 'users', partnerCode.trim());
            const partnerDocSnap = await getDoc(partnerDocRef);

            if (!partnerDocSnap.exists()) {
                setLinkingError(
                    'Partner not found. Please check the code and try again.'
                );
                return;
            }

            const partnerData = partnerDocSnap.data();

            // Check if partner already has a couple
            if (partnerData.coupleId && partnerData.coupleId !== '') {
                setLinkingError(
                    'This partner is already linked to someone else.'
                );
                return;
            }

            // Check if current user already has a couple
            if (
                currentUserProfile.coupleId &&
                currentUserProfile.coupleId !== ''
            ) {
                setLinkingError(
                    'You are already linked to a partner. Please unlink first.'
                );
                return;
            }

            // Generate a unique couple ID
            const coupleId = `couple_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

            // Create the couple document
            const coupleDocRef = doc(db, 'couples', coupleId);
            await setDoc(coupleDocRef, {
                coupleId: coupleId,
                members: [user.uid, partnerCode.trim()],
                createdAt: new Date().toISOString(),
            });

            // Update current user with coupleId
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                coupleId: coupleId,
            });

            // Update partner with coupleId
            await updateDoc(partnerDocRef, {
                coupleId: coupleId,
            });

            // Refresh profiles to get updated data
            await refreshProfiles();

            setLinkingSuccess(true);
            setPartnerCode('');
            setTimeout(() => setLinkingSuccess(false), 3000);
        } catch (error) {
            console.error('Error linking partner:', error);
            setLinkingError(
                'An error occurred while linking. Please try again.'
            );
        } finally {
            setIsLinking(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 pb-20">
            {/* Header */}
            <header className="p-6">
                <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
            </header>

            <main className="p-4 space-y-6">
                {/* Profile Section */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="text-cyan-500" size={24} />
                        <h2 className="text-xl font-semibold text-slate-100">
                            Profile
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="displayName"
                                className="block text-sm font-medium text-slate-300 mb-2"
                            >
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Enter your display name"
                            />
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={
                                isSaving ||
                                !displayName.trim() ||
                                displayName === currentUserProfile?.name
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {saveSuccess ? (
                                <>
                                    <Check size={16} />
                                    Saved!
                                </>
                            ) : (
                                <>{isSaving ? 'Saving...' : 'Save Changes'}</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-cyan-500" size={24} />
                        <h2 className="text-xl font-semibold text-slate-100">
                            Notifications
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Daily Reminder */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-100 font-medium">
                                    Daily Reminder
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Get reminded to check in on your habits
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={dailyReminder}
                                    onChange={(e) =>
                                        updateNotificationPref(
                                            setDailyReminder,
                                            e.target.checked
                                        )
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                            </label>
                        </div>

                        {/* Partner Achievement Alerts */}
                        <div className="pt-4 border-t border-slate-700">
                            <h3 className="text-slate-100 font-medium mb-3">
                                Partner Achievement Alerts
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">
                                        Perfect Week Celebrations
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={partnerPerfectWeek}
                                            onChange={(e) =>
                                                updateNotificationPref(
                                                    setPartnerPerfectWeek,
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">
                                        Streak Milestones
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={partnerStreaks}
                                            onChange={(e) =>
                                                updateNotificationPref(
                                                    setPartnerStreaks,
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">
                                        Major Milestones
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={partnerMilestones}
                                            onChange={(e) =>
                                                updateNotificationPref(
                                                    setPartnerMilestones,
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="text-cyan-500" size={24} />
                        <h2 className="text-xl font-semibold text-slate-100">
                            Account
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Personal Linking Code - Always visible */}
                        <div>
                            <h3 className="text-slate-100 font-medium mb-2">
                                Your Linking Code
                            </h3>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg font-mono text-sm">
                                    {user?.uid}
                                </code>
                                <button
                                    onClick={() =>
                                        copyToClipboard(user?.uid || '')
                                    }
                                    className="p-2 bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-100 hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                    {codeCopied ? (
                                        <Check size={16} />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">
                                Share this code with your partner so they can
                                link to you
                            </p>
                        </div>

                        {/* Partner Linking Section - Only show if not linked */}
                        {!partnerProfile && (
                            <div>
                                <h3 className="text-slate-100 font-medium mb-2">
                                    Link to Partner
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            value={partnerCode}
                                            onChange={(e) =>
                                                setPartnerCode(e.target.value)
                                            }
                                            placeholder="Enter your partner's linking code"
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                                        />
                                        {linkingError && (
                                            <p className="text-red-400 text-sm mt-1">
                                                {linkingError}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleLinkPartner}
                                        disabled={
                                            isLinking || !partnerCode.trim()
                                        }
                                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {linkingSuccess ? (
                                            <>
                                                <Check size={16} />
                                                Linked Successfully!
                                            </>
                                        ) : (
                                            <>
                                                <Link size={16} />
                                                {isLinking
                                                    ? 'Linking...'
                                                    : 'Link Partner'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Couple Code - Only show if linked */}
                        {currentUserProfile?.coupleId && partnerProfile && (
                            <div>
                                <h3 className="text-slate-100 font-medium mb-2">
                                    Couple ID
                                </h3>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg font-mono text-sm">
                                        {currentUserProfile.coupleId}
                                    </code>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                currentUserProfile.coupleId
                                            )
                                        }
                                        className="p-2 bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-100 hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        {codeCopied ? (
                                            <Check size={16} />
                                        ) : (
                                            <Copy size={16} />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 mt-1">
                                    Your shared couple identifier
                                </p>
                            </div>
                        )}

                        {/* Partner Status */}
                        <div>
                            <h3 className="text-slate-100 font-medium mb-2">
                                Partner Status
                            </h3>
                            {partnerProfile ? (
                                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                                    <div>
                                        <p className="text-slate-100">
                                            Linked to:{' '}
                                            <span className="font-medium">
                                                {partnerProfile.name}
                                            </span>
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Partner account active
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowUnlinkModal(true)}
                                        className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Unlink size={16} />
                                        Unlink
                                    </button>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-700 rounded-lg">
                                    <p className="text-slate-400">
                                        No partner linked
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activity Log Link */}
                <button
                    onClick={() => router.push('/activity-log')}
                    className="w-full bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Activity className="text-cyan-500" size={24} />
                        <div className="text-left">
                            <h2 className="text-xl font-semibold text-slate-100">
                                Activity Log
                            </h2>
                            <p className="text-slate-400">
                                View your complete activity history
                            </p>
                        </div>
                    </div>
                </button>

                {/* Logout Button */}
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="text-lg font-medium">Logout</span>
                </button>
            </main>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showUnlinkModal}
                onClose={() => setShowUnlinkModal(false)}
                onConfirm={handleUnlinkPartner}
                title="Unlink Partner"
                message="Are you sure you want to unlink from your partner? This will disconnect both accounts and cannot be undone easily."
                confirmText={isUnlinking ? 'Unlinking...' : 'Unlink'}
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Logout"
                message="Are you sure you want to logout? You'll need to sign in again to access your account."
                confirmText="Logout"
                isDestructive={true}
            />
        </div>
    );
}
