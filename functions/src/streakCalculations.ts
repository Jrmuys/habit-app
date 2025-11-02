import { HabitEntry, HabitTemplate } from './types';

export type StreakInfo = {
    currentStreak: number; // Number of consecutive days (full completions only for streak counting)
    multiplier: number; // 1.0, 1.2, or 1.5
    hasShield: boolean; // True if earned at 7, 14, 21... days of full completions
    shieldActive: boolean; // True if shield is protecting a current miss
    lastCompletedDate: string | null;
};

/**
 * Calculate streak information for a habit goal
 * NEW RULES:
 * - Only FULL completions (value === true for checkbox) count toward streak
 * - Partial/ShowUp entries maintain the streak but don't increase it or earn shields
 * - Shields are earned every 7 days of FULL completion streak (7, 14, 21, ...)
 * - Only FULL completions get multiplier applied
 * 
 * @param entries - All entries for this monthly goal, sorted by targetDate descending
 * @param template - The habit template with configuration
 * @param today - Today's date in YYYY-MM-DD format
 * @returns StreakInfo object with current streak and shield status
 */
export function calculateStreak(
    entries: HabitEntry[],
    template: HabitTemplate | undefined,
    today: string
): StreakInfo {
    if (entries.length === 0) {
        return {
            currentStreak: 0,
            multiplier: 1.0,
            hasShield: false,
            shieldActive: false,
            lastCompletedDate: null
        };
    }

    // Sort entries by date descending (most recent first)
    const sortedEntries = [...entries].sort((a, b) => 
        b.targetDate.localeCompare(a.targetDate)
    );

    let currentStreak = 0; // Only counts full completions
    let shieldUsed = false;
    let missedDayCount = 0;
    let lastCompletedDate: string | null = null;

    // Helper function to determine if an entry is a FULL completion
    const isFullCompletion = (entry: HabitEntry): boolean => {
        // Only value === true counts as full completion
        // All other values (showUp, strings, numbers, false) are not full completions
        return entry.value === true;
    };

    // Start from today and work backwards
    const todayDate = new Date(today);
    let checkDate = new Date(todayDate);

    // Count consecutive days, tracking full completions for streak
    for (let i = 0; i < 365; i++) { // Max 365 days to check
        const checkDateStr = checkDate.toISOString().slice(0, 10);
        const entry = sortedEntries.find(e => e.targetDate === checkDateStr);

        if (entry) {
            if (isFullCompletion(entry)) {
                // Full completion - increments streak
                currentStreak++;
                if (!lastCompletedDate) {
                    lastCompletedDate = checkDateStr;
                }
                missedDayCount = 0; // Reset missed day count
            } else {
                // Partial/ShowUp completion - maintains streak but doesn't increase it
                // This keeps the streak alive without incrementing the counter
                if (!lastCompletedDate) {
                    lastCompletedDate = checkDateStr;
                }
                missedDayCount = 0; // Reset missed day count (streak maintained)
            }
        } else {
            // No entry for this day
            missedDayCount++;

            // If we have earned shields and this is the first miss, use a shield
            // Shields are earned every 7 days of full streak: 7, 14, 21, ...
            const shieldsEarned = Math.floor(currentStreak / 7);
            if (shieldsEarned > 0 && missedDayCount === 1 && !shieldUsed) {
                shieldUsed = true;
                // Shield protects the streak, so we continue
            } else {
                // Streak is broken
                break;
            }
        }

        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate multiplier based on streak length (only for full completions)
    let multiplier = 1.0;
    if (currentStreak >= 14) {
        multiplier = 1.5;
    } else if (currentStreak >= 7) {
        multiplier = 1.2;
    }

    // Shield is available if we have at least one shield earned (every 7 days)
    // and haven't used it yet
    const shieldsEarned = Math.floor(currentStreak / 7);
    const hasShield = shieldsEarned > 0;
    const shieldActive = shieldUsed;

    return {
        currentStreak,
        multiplier,
        hasShield,
        shieldActive,
        lastCompletedDate
    };
}

/**
 * Calculate points earned for a habit entry
 * NEW RULES:
 * - Full completion (value === true): basePoints (default 100) WITH multiplier
 * - Partial/Just Show Up (value === 'showUp' or other values): 25 points, NO multiplier
 * - No distinction between partial and showUp - both are 25 points with no multiplier
 * 
 * @param entry - The habit entry
 * @param template - The habit template with point configuration
 * @param streakInfo - Current streak information
 * @returns Points earned for this entry
 */
export function calculatePoints(
    entry: HabitEntry,
    template: HabitTemplate | undefined,
    streakInfo: StreakInfo
): number {
    if (!template) return 0;

    const basePoints = template.basePoints ?? 100;
    // Partial and showUp are now the same - both get 25 points, no multiplier
    const partialShowUpPoints = 25;

    // Determine which points to use based on entry value
    let points = 0;
    if (entry.value === true) {
        // Full completion - ONLY this gets the multiplier
        points = basePoints * streakInfo.multiplier;
    } else if (entry.value === 'showUp' || 
               typeof entry.value === 'number' || 
               typeof entry.value === 'string') {
        // Partial/Just Show Up - all treated the same: 25 points, NO multiplier
        points = partialShowUpPoints;
    } else if (entry.value === false) {
        // Explicitly marked as not done
        points = 0;
    }

    return Math.round(points);
}

/**
 * Generate recent history array (last 7 days) for a habit
 * @param entries - All entries for this monthly goal
 * @param today - Today's date in YYYY-MM-DD format
 * @returns Array of 7 booleans indicating completion for each of the last 7 days
 */
export function getRecentHistory(
    entries: HabitEntry[],
    today: string
): boolean[] {
    const history: boolean[] = [];
    const todayDate = new Date(today);

    for (let i = 6; i >= 0; i--) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = checkDate.toISOString().slice(0, 10);
        
        const hasEntry = entries.some(e => e.targetDate === checkDateStr);
        history.push(hasEntry);
    }

    return history;
}
