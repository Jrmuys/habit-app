import { HabitEntry, HabitTemplate } from './types';

export type StreakInfo = {
    currentStreak: number; // Number of consecutive days
    multiplier: number; // 1.0, 1.2, or 1.5
    hasShield: boolean; // True if earned at 7+ days
    shieldActive: boolean; // True if shield is protecting a current miss
    lastCompletedDate: string | null;
};

/**
 * Calculate streak information for a habit goal
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

    let currentStreak = 0;
    let shieldUsed = false;
    let missedDayCount = 0;
    let lastCompletedDate: string | null = null;

    // Start from today and work backwards
    const todayDate = new Date(today);
    let checkDate = new Date(todayDate);

    // Count consecutive days with entries (including "showUp" entries)
    for (let i = 0; i < 365; i++) { // Max 365 days to check
        const checkDateStr = checkDate.toISOString().slice(0, 10);
        const entry = sortedEntries.find(e => e.targetDate === checkDateStr);

        if (entry) {
            // Valid entry found (can be true, number, string, or "showUp")
            currentStreak++;
            if (!lastCompletedDate) {
                lastCompletedDate = checkDateStr;
            }
            missedDayCount = 0; // Reset missed day count
        } else {
            // No entry for this day
            missedDayCount++;

            // If we have a shield and this is the first miss, use the shield
            if (currentStreak >= 7 && missedDayCount === 1 && !shieldUsed) {
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

    // Calculate multiplier based on streak length
    let multiplier = 1.0;
    if (currentStreak >= 14) {
        multiplier = 1.5;
    } else if (currentStreak >= 7) {
        multiplier = 1.2;
    }

    // Shield is earned at 7+ days
    const hasShield = currentStreak >= 7;
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
    const partialPoints = template.partialPoints ?? 25;
    const showUpPoints = template.showUpPoints ?? 1;

    // Determine which points to use based on entry value
    let points = 0;
    if (entry.value === 'showUp') {
        // "Just Show Up" entries get minimal points, not affected by multiplier
        points = showUpPoints;
    } else if (entry.value === true) {
        // Full completion
        points = basePoints * streakInfo.multiplier;
    } else if (typeof entry.value === 'number' || typeof entry.value === 'string') {
        // Partial completion (could be a number or specific value)
        points = partialPoints * streakInfo.multiplier;
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
