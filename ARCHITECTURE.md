# Habit App Architecture

## Overview

This document describes the refactored architecture where business logic has been moved from client-side React hooks to server-side processing.

## Architecture Changes (Phase 1 & 2 Complete)

### Before (V1)
- **Client-heavy**: All calculations (streaks, shields, points, weekly progress) were done in `useMemo` hooks on the client side
- **Data fetching**: Client components directly queried Firestore using `useHabits` hook
- **Performance**: Large data transfers and client-side processing on every render

### After (V2)
- **Server-heavy**: Business logic moved to server-side (API routes and Firebase Functions)
- **Smart backend**: Calculations happen on the server and only final results are sent to client
- **Dumb frontend**: Client components focus on rendering and user interaction

## Key Components

### 1. Firebase Functions (`/functions`)
Server-side functions that can be deployed to Firebase:
- `getDashboardState`: Fetches and calculates all dashboard data
- `logHabitEntry`: Handles habit entry logging

These functions contain the "brain" - all the business logic for:
- Calculating today's and yesterday's habits
- Computing weekly progress
- Processing user and partner data
- Determining streak status

### 2. Next.js API Routes (`/src/app/api`)
API routes that mirror Firebase Functions logic for Next.js deployment:
- `/api/dashboard`: Returns computed dashboard state
- Future: `/api/log-habit` for habit entry logging (currently uses direct Firestore)

### 3. Client Components

#### Dashboard Page (`/src/app/(protected)/dashboard/page.tsx`)
- **Type**: Client Component
- **Purpose**: Fetch dashboard state and render UI
- **Key Hook**: `useDashboardState` - fetches pre-computed state from API

#### DashboardClient (`/src/components/DashboardClient.tsx`)
- **Purpose**: Pure UI component that renders dashboard state
- **Props**: Receives `dashboardState` with all pre-computed data
- **Responsibilities**: Display data, handle user interactions, manage dialog state

### 4. Simplified Hooks

#### `useDashboardState` (`/src/hooks/useDashboardState.ts`)
- Replaces complex `useMemo` calculations
- Calls `/api/dashboard` to get pre-computed state
- Returns: `{ dashboardState, loading, error }`

#### `useHabitsSimplified` (`/src/hooks/useHabitsSimplified.ts`)
- Provides write operations only (create, update, delete, log)
- No data fetching (that's handled by the API)
- Used by DashboardClient for habit logging

#### `useHabits` (Original - Still Used by Other Pages)
- Still contains data fetching for pages not yet refactored
- Used by: add-habit, plan-next-month, edit-habits, partner, history
- Will be phased out as other pages are refactored

## Data Flow

### Dashboard Load Flow
```
1. User loads /dashboard
2. DashboardPage component mounts
3. useDashboardState hook calls /api/dashboard
4. API route:
   - Fetches user profile from Firestore
   - Fetches habit templates, monthly goals, entries
   - Performs all calculations (today's habits, weekly progress, etc.)
   - Returns computed DashboardState object
5. DashboardClient receives state and renders UI
```

### Habit Logging Flow
```
1. User clicks habit to log
2. DashboardClient calls logHabitEntry from useHabitsSimplified
3. Direct Firestore write (or future: call to API/Firebase Function)
4. Entry saved
5. UI can refetch dashboard state to reflect changes
```

## Benefits

1. **Performance**: Reduced client-side processing and data transfer
2. **Scalability**: Server can handle complex calculations efficiently
3. **Maintainability**: Business logic centralized in one place
4. **Testability**: Server-side logic easier to test
5. **Future-ready**: Can add caching, background jobs, etc.

## Future Enhancements

### Phase 3 (Planned)
- Refactor partner, history pages to use API routes
- Implement real-time updates using webhooks or Firestore triggers
- Add caching layer for frequently accessed data
- Implement background jobs for streak calculations
- Add comprehensive server-side tests

### Phase 4 (Planned)
- Points and rewards calculation moved to server
- Leaderboard functionality
- Notification system
- Analytics and insights

## File Structure

```
habit-app/
├── functions/                      # Firebase Functions (deployable)
│   ├── src/
│   │   ├── index.ts               # Function exports
│   │   ├── getDashboardState.ts   # Dashboard logic
│   │   ├── logHabitEntry.ts       # Habit logging logic
│   │   └── types.ts               # Type definitions
│   └── package.json
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── dashboard/
│   │   │       └── route.ts       # Dashboard API route
│   │   └── (protected)/
│   │       └── dashboard/
│   │           └── page.tsx       # Dashboard page (refactored)
│   ├── components/
│   │   └── DashboardClient.tsx    # Dashboard UI component
│   ├── hooks/
│   │   ├── useDashboardState.ts   # Dashboard state hook
│   │   ├── useHabitsSimplified.ts # Simplified habits hook
│   │   └── useHabits.ts           # Original (for other pages)
│   └── lib/
│       └── dashboardFunctions.ts  # API client functions
└── ARCHITECTURE.md                # This file
```

## Migration Guide

To migrate other pages to this architecture:

1. Create API route with business logic (similar to `/api/dashboard`)
2. Create custom hook to fetch from API (similar to `useDashboardState`)
3. Split page into client component for UI
4. Update imports to use simplified hooks for write operations
5. Test thoroughly
6. Remove old `useMemo` calculations

## Notes

- Original dashboard implementation preserved in `page-old.tsx` for reference
- Firebase Functions can be deployed separately for cloud execution
- API routes are used for local Next.js deployment
- Both implementations share the same business logic
