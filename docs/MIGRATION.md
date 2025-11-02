# Data Migration Guide: Top-Level Collections to Subcollections

## Overview

This document describes the migration from top-level collections to subcollections under `users/{userId}/` as specified in the system architecture.

## Changes

### Before (Old Structure)
```
/habits/{habitId}
  - habitId
  - userId
  - name
  - ...

/monthlyGoals/{goalId}
  - monthlyGoalId
  - userId
  - habitId
  - ...

/habitEntries/{entryId}
  - entryId
  - userId
  - monthlyGoalId
  - ...

/milestones/{milestoneId}
  - milestoneId
  - userId
  - ...

/rewards/{rewardId}
  - rewardId
  - userId
  - ...
```

### After (New Structure)
```
/users/{userId}/habitLibrary/{habitId}
  - habitId (from doc.id)
  - userId (still included for consistency)
  - name
  - ...

/users/{userId}/monthlyGoals/{goalId}
  - monthlyGoalId (from doc.id)
  - userId
  - habitId
  - ...

/users/{userId}/habitEntries/{entryId}
  - entryId (from doc.id)
  - userId
  - monthlyGoalId
  - ...

/users/{userId}/milestones/{milestoneId}
  - milestoneId (from doc.id)
  - userId
  - ...

/users/{userId}/rewards/{rewardId}
  - rewardId (from doc.id)
  - userId
  - ...
```

## Migration Strategy

### Phase 1: Dual-Write Period (CURRENT)
1. ✅ New Firestore rules support both old and new paths
2. ✅ Firebase Functions updated to write to subcollections
3. Frontend still reads from both old and new locations
4. New data goes to subcollections only

### Phase 2: Data Migration Script
1. Create a migration script to copy existing data:
   - For each user in `/users`:
     - Copy all habits from `/habits` where `userId == user.uid` to `/users/{uid}/habitLibrary/`
     - Copy all monthlyGoals from `/monthlyGoals` where `userId == user.uid` to `/users/{uid}/monthlyGoals/`
     - Copy all habitEntries from `/habitEntries` where `userId == user.uid` to `/users/{uid}/habitEntries/`
     - Copy all milestones from `/milestones` where `userId == user.uid` to `/users/{uid}/milestones/`
     - Copy all rewards from `/rewards` where `userId == user.uid` to `/users/{uid}/rewards/`

2. Preserve document IDs during migration to maintain references

### Phase 3: Frontend Update
1. Update all frontend components to read from subcollections
2. Update hooks to use subcollection paths
3. Test thoroughly with migrated data

### Phase 4: Cleanup
1. Once all data is migrated and frontend is updated:
   - Remove old top-level collections
   - Remove legacy rules from firestore.rules
   - Remove any remaining references to old paths

## Migration Script Example

```javascript
// migrations/migrateToSubcollections.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function migrateCollectionForUser(userId, oldCollectionName, newCollectionName) {
  console.log(`Migrating ${oldCollectionName} for user ${userId}...`);
  
  const oldDocs = await db.collection(oldCollectionName)
    .where('userId', '==', userId)
    .get();
  
  const batch = db.batch();
  let count = 0;
  
  for (const doc of oldDocs.docs) {
    const newDocRef = db.collection('users')
      .doc(userId)
      .collection(newCollectionName)
      .doc(doc.id); // Preserve document ID
    
    batch.set(newDocRef, doc.data());
    count++;
    
    // Firestore batch limit is 500
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  Committed batch of ${count} documents...`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`  Migrated ${count} documents from ${oldCollectionName} to ${newCollectionName}`);
  return count;
}

async function migrateAllUsers() {
  const usersSnapshot = await db.collection('users').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`\nMigrating data for user ${userId}...`);
    
    await migrateCollectionForUser(userId, 'habits', 'habitLibrary');
    await migrateCollectionForUser(userId, 'monthlyGoals', 'monthlyGoals');
    await migrateCollectionForUser(userId, 'habitEntries', 'habitEntries');
    await migrateCollectionForUser(userId, 'milestones', 'milestones');
    await migrateCollectionForUser(userId, 'rewards', 'rewards');
  }
  
  console.log('\nMigration complete!');
}

migrateAllUsers().catch(console.error);
```

## Running the Migration

```bash
# 1. Install dependencies
cd migrations
npm install firebase-admin

# 2. Set up service account credentials
# Download service account key from Firebase Console
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"

# 3. Run migration
node migrateToSubcollections.js

# 4. Verify migration
node verifyMigration.js
```

## Rollback Plan

If issues are discovered:
1. Old data still exists in top-level collections
2. Firestore rules still allow reading from old locations
3. Can quickly revert frontend to use old paths
4. Can delete migrated subcollections if needed

## Testing

Before running in production:
1. Test migration script on a development/staging environment
2. Verify document counts match between old and new locations
3. Test all CRUD operations using new paths
4. Verify frontend displays data correctly
5. Test with multiple users to ensure proper isolation

## Important Notes

- Document IDs are preserved during migration to maintain references
- The `userId` field is kept in documents for consistency
- Migration is non-destructive - old data remains until Phase 4
- Activity logs under `couples/{coupleId}/activityLog/` remain unchanged
- The `couples` collection structure remains unchanged
