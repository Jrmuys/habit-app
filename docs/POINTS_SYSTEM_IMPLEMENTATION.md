# Points System Implementation

## Overview
This document describes the implementation of the points calculation and accumulation system for the habit tracking app.

## Problem Statement
According to the architecture document, "Users earn points immediately for daily actions" with multipliers for streaks. However, the system was not calculating or awarding points when habit entries were logged.

## Solution
Implemented points calculation in the `logHabitEntry` Firebase Callable Function to ensure points are calculated and awarded atomically when a user logs a habit.

## Implementation Details

### 1. Points Calculation Logic
Location: `functions/src/streakCalculations.ts`

The `calculatePoints` function determines points based on:

#### Full Completion (value === true)
- Base points (default 100) WITH streak multiplier
- Multipliers:
  - Days 0-6: 1.0x → 100 points
  - Days 7-13: 1.2x → 120 points
  - Days 14+: 1.5x → 150 points

#### Partial/Show Up (value === 'showUp' or other values)
- Fixed 25 points
- NO multiplier applied
- Maintains streak but doesn't increase it

### 2. logHabitEntry Function
Location: `functions/src/logHabitEntry.ts`

**Key Changes:**
1. Uses Firestore transaction for atomic operations
2. Fetches monthly goal and habit template
3. Retrieves all existing entries to calculate current streak
4. Calculates streak info INCLUDING the new entry
5. Calculates points using `calculatePoints` function
6. Atomically:
   - Creates the habit entry
   - Updates user's total points
7. Returns `{ entryId, pointsAwarded }`

**Previous Implementation:**
```typescript
export async function logHabitEntry(
    userId: string,
    entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>
): Promise<string> {
    const db = admin.firestore();
    const newEntry = { ...entryData, userId, timestamp: new Date().toISOString() };
    const docRef = await db.collection('users').doc(userId).collection('habitEntries').add(newEntry);
    return docRef.id;
}
```

**New Implementation:**
```typescript
export async function logHabitEntry(
    userId: string,
    entryData: Omit<HabitEntry, 'entryId' | 'userId' | 'timestamp'>
): Promise<{ entryId: string; pointsAwarded: number }> {
    const db = admin.firestore();
    
    const result = await db.runTransaction(async (transaction) => {
        // 1. Get monthly goal and habit template
        // 2. Get existing entries for streak calculation
        // 3. Calculate streak with new entry
        // 4. Calculate points
        // 5. Create entry
        // 6. Update user points
        return { entryId, pointsAwarded };
    });
    
    return result;
}
```

### 3. Client-Side Updates
Location: `src/lib/firebaseFunctions.ts`

Updated type definition:
```typescript
export type LogHabitEntryResponse = {
    entryId: string;
    pointsAwarded: number;  // NEW
    success: boolean;
};
```

### 4. Firebase Functions Index
Location: `functions/src/index.ts`

Updated callable function to return new response format:
```typescript
const result = await logHabitEntry(userId, data);
return { ...result, success: true };
```

## Data Flow

```
User logs habit
    ↓
Client calls logHabitEntry Firebase Function
    ↓
Function starts transaction
    ↓
Fetch monthly goal & habit template
    ↓
Fetch existing entries
    ↓
Calculate streak (with new entry)
    ↓
Calculate points (based on value & streak)
    ↓
Create habit entry in subcollection
    ↓
Add points to user profile
    ↓
Commit transaction
    ↓
Return { entryId, pointsAwarded }
    ↓
Client receives response (can display points earned)
```

## Points Examples

### Example 1: New Habit
- Day 1: Full completion → 100 points (1.0x multiplier)
- Day 2: Full completion → 100 points (1.0x multiplier)
- Day 3: Partial completion → 25 points (no multiplier)
- Total: 225 points

### Example 2: Building Streak
- Days 1-6: Full completions → 600 points (6 × 100)
- Day 7: Full completion → 120 points (1.2x multiplier, shield earned!)
- Day 8: Partial → 25 points (no multiplier, streak maintained)
- Day 9: Full completion → 120 points (1.2x multiplier)
- Total: 865 points

### Example 3: Long Streak
- Days 1-13: All full → 1,440 points (6×100 + 7×120)
- Day 14: Full completion → 150 points (1.5x multiplier)
- Day 15: Full completion → 150 points (1.5x multiplier)
- Total from days 14-15: 300 points

## User Profile Points
Location: `users/{uid}` document

The `points` field in the user profile document is updated atomically with each habit entry:
```
currentPoints = userDoc.data()?.points || 0
transaction.update(userRef, { points: currentPoints + pointsAwarded })
```

## Consistency Guarantees

### Transaction Safety
Using Firestore transactions ensures:
1. Both entry creation and points update succeed together
2. If either operation fails, both are rolled back
3. No partial state where entry exists but points weren't awarded
4. No race conditions with concurrent updates

### Error Handling
- If monthly goal not found → Error thrown, transaction rolled back
- If user not found → Error thrown, transaction rolled back
- Any calculation error → Transaction rolled back

## Integration with Other Features

### Milestone Completion
Location: `functions/src/completeMilestone.ts`

Already uses same pattern:
```typescript
const result = await db.runTransaction(async (transaction) => {
    // Mark milestone as completed
    // Award points to user
    return { pointsAwarded };
});
```

### Reward Redemption
Location: `functions/src/redeemReward.ts`

Already uses same pattern:
```typescript
const result = await db.runTransaction(async (transaction) => {
    // Check points balance
    // Mark reward as redeemed
    // Deduct points from user
    return { pointsSpent };
});
```

## Known Limitations & TODOs

### 1. Delete Entry - Points Not Deducted
**Location:** `src/hooks/useHabitsSimplified.ts`

When a user "undos" a habit log, the entry is deleted but points are not deducted:
```typescript
// TODO: Create Firebase Callable Function for deleteHabitEntry
// Should deduct points that were awarded for this entry
const entryRef = doc(db, 'users', user.uid, 'habitEntries', entryId);
await deleteDoc(entryRef);
```

**Impact:** Medium - Users can artificially inflate points by logging and deleting repeatedly

**Future Fix:** Create `deleteHabitEntryCallable` function that:
1. Fetches the entry to get its value and targetDate
2. Recalculates what streak/points it would have earned
3. Deducts those points from user
4. Deletes the entry

### 2. Recalculation on Historical Changes
If a user edits a past entry that affects streak calculation, current points don't recalculate.

**Future Fix:** Background job to recalculate all points from entries

### 3. Points Display Not Yet Verified
While points are being calculated and stored, the UI display hasn't been tested with live Firebase.

**Testing Needed:**
- Verify points show in dashboard
- Verify points update in real-time
- Verify milestone completion adds points correctly
- Verify reward redemption deducts points correctly

## Testing Strategy

### Manual Testing Steps
1. Create a new habit and monthly goal
2. Log habit entries for several days
3. Check user profile points in Firestore console
4. Verify points match expected calculation
5. Test partial completions (should get 25 points)
6. Build a 7-day streak (should get multiplier)
7. Complete a milestone (should add points)
8. Redeem a reward (should deduct points)

### Automated Testing (Future)
```typescript
describe('logHabitEntry', () => {
  it('awards 100 points for full completion on day 1', async () => {
    const result = await logHabitEntry(userId, {
      monthlyGoalId: 'goal1',
      targetDate: '2025-01-01',
      value: true
    });
    expect(result.pointsAwarded).toBe(100);
  });
  
  it('awards 120 points with 1.2x multiplier at 7 days', async () => {
    // Setup: Create entries for days 1-6
    // Test: Log day 7
    // Assert: pointsAwarded === 120
  });
  
  it('awards 25 points for partial completion', async () => {
    const result = await logHabitEntry(userId, {
      monthlyGoalId: 'goal1',
      targetDate: '2025-01-01',
      value: 'showUp'
    });
    expect(result.pointsAwarded).toBe(25);
  });
});
```

## Architecture Compliance

✅ **"Users earn points immediately for daily actions"** - Points calculated and awarded on logHabitEntry

✅ **Points stored in user profile** - Transaction updates users/{uid}.points

✅ **Multipliers for streaks** - calculatePoints applies 1.0x, 1.2x, or 1.5x based on streak

✅ **Base points configurable** - HabitTemplate has basePoints field (default 100)

✅ **Partial completion points** - Fixed 25 points, no multiplier

✅ **Business logic on server** - All calculations in Firebase Functions

## Conclusion
The points system is now functional and follows the architecture requirements. Users will earn points immediately when logging habits, with streak multipliers correctly applied. The transaction-based approach ensures data consistency and prevents race conditions.
