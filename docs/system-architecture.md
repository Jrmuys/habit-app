### **1. Project Vision & Core Purpose**

This app is a specialized habit and goal-tracking tool designed for a couple. Its core purpose is to foster mutual encouragement, motivation, and accountability in a positive and supportive environment. It is built on the principles of *Atomic Habits*, rewarding daily consistency and the process, not just the outcome.


### **2. Core Features & User Stories**



* **Authentication:** Users sign up individually (Email/Password or Google). They can then "link" their accounts by sharing a unique code, which places them in a couples document.
* **Dashboard:** Users see a personalized view of their daily habits, current streaks, and point total.
* **Habit Tracking:** Users can log daily habits, including partial completions. The system supports complex habits (e.g., "do X, 3 times a week") through a flexible constraint model.
* **Point System:** Users earn points immediately for daily actions, with multipliers for streaks and a "Streak Shield" to protect consistency.
* **Milestones:** Users can create one-off "Milestone" tasks (e.g., "Schedule dentist") for a fixed point reward.
* **Rewards:** Users can create a personal list of rewards with custom point costs, which they can redeem with their earned points.
* **Partner View:** Users can view their partner's dashboard to see their progress, fostering accountability and encouragement.
* **History & Planning:** Users can view their past performance and, crucially, plan their "Monthly Goals" for the upcoming month.


### **3. Style Guide (Tailwind CSS)**

This guide is based on your Figma design and our color discussion.


#### **A. Color Palette**



* **Primary Background:** Dark Slate. bg-slate-900
* **Card & Panel Background:** Lighter Slate. bg-slate-800
* **Borders & Dividers:** Muted Slate. border-slate-700
* **Primary Text (Headings):** White/Light Slate. text-slate-100
* **Secondary/Muted Text:** Gray Slate. text-slate-400
* **Primary Accent (Active Tab, Links):** Cyan. text-cyan-500 or bg-cyan-500
* **Success State (Completed, Streaks):** Vibrant Green. bg-emerald-500
* **Warning/In-Progress (User 2):** Bright Orange. bg-orange-500
* **Alert/Miss (User 1):** Bright Red. bg-red-500


#### **B. Typography (Inter Font)**



* **Page Title (h1):** text-3xl font-bold text-slate-100
* **Section Title (h2):** text-xl font-semibold text-slate-100 (e.g., "Today", "Yesterday")
* **Card Title (h3):** text-lg font-semibold text-slate-100 (e.g., "30 Min Activity")
* **Body Text:** text-base font-medium text-slate-300
* **Labels & Metadata:** text-sm font-medium text-slate-400 (e.g., "3 grace days left")


#### **C. UI Components**



* **Cards:** bg-slate-800 rounded-lg shadow-lg p-4
* **Buttons (Primary):** bg-cyan-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-cyan-700
* **Habit Circles (Completed):** bg-emerald-500
* **Habit Circles (Incomplete):** bg-slate-700
* **Navigation Bar:** bg-slate-800 border-t border-slate-700


### **4. Application Architecture**

This project uses a **Next.js** frontend with a **Firebase** backend. The architecture is built on the **"Calculated State on Read"** principle.



* **Next.js Frontend (The "View"):**
    * Uses the App Router.
    * **Server Components** are used for pages to fetch initial data.
    * **Client Components** ("use client") are used for all interactive UI (buttons, forms, etc.).
    * The frontend is "dumb" and contains no business logic. It only displays data and calls Firebase Functions.
* **Firestore (The "Source of Truth"):**
    * Stores the immutable *log* of all user actions.
    * Does *not* store calculated state like "current streak" or "total points". This data is derived.
* **Firebase Callable Functions (The "Brain"):**
    * This is where **100% of the business logic** lives.
    * **logHabitEntry(habitId, targetDate, value):** A function the app calls to write a new document to the habitEntries collection.
    * **getDashboardState():** The main function the app calls on page load. It reads the *entire* log of habitEntries for the user, calculates all current streaks, shields, and total points *on the server*, and returns a clean JSON object to the frontend for display.
* **Firebase Authentication:**
    * Handles user login (Email/Password, Google).
    * Crucially, **Callable Functions** are used because they automatically verify the user's auth token, providing a secure uid for every request without manual boilerplate.


### **5. Database Structure (Firestore)**



* **users**:
    * uid (Doc ID): The user's Firebase Auth UID.
    * email: User's email.
    * name: User's display name.
    * coupleId: The ID of the couples doc they belong to.
    * createdAt: Timestamp.
* **couples**:
    * coupleId (Doc ID): A unique, generated ID.
    * user1_uid: The UID of the first user.
    * user2_uid: The UID of the second user.
    * linkCode: A one-time code used for linking.
* **habitLibrary**:
    * A subcollection under *each user* (users/{uid}/habitLibrary).
    * habitId (Doc ID): A unique ID for the *template*.
    * name: "30 Min Movement"
    * icon: "run"
    * description: "My general movement habit."
* **monthlyGoals**:
    * A subcollection under *each user* (users/{uid}/monthlyGoals).
    * goalId (Doc ID): A unique ID.
    * habitId: The ID of the habit from the habitLibrary.
    * month: The month this goal is for (e.g., "2025-10").
    * rules: An object defining the *specific* goals for this month (see Habit System).
* **habitEntries**:
    * A subcollection under *each user* (users/{uid}/habitEntries).
    * entryId (Doc ID): A unique ID.
    * goalId: The monthlyGoals ID this entry is for.
    * targetDate: The date the habit was for (e.g., "2025-10-08").
    * value: The data logged (e.g., true, 25, "Run").
* **rewards**:
    * A subcollection under *each user* (users/{uid}/rewards).
    * rewardId (Doc ID): A unique ID.
    * name: "New Video Game"
    * cost: 15000 (points)
    * isRedeemed: boolean
* **activityLog**:
    * A subcollection under the couples doc (couples/{coupleId}/activityLog).
    * Stores a log of significant shared events (partner completions, etc.).


### **6. Core Logic: The "Momentum" Point System**

This system is designed to be calculated *on the fly* by the getDashboardState function.



* **Base Points:**
    * **Full Completion:** **100 points**.
    * **Partial Completion:** **25 points**.
* **Streak Multipliers:** Applied to the base points based on the *current calculated streak*:
    * **Days 0-6:** **1.0x** (100 pts)
    * **Days 7-13:** **1.2x** (120 pts)
    * **Days 14+:** **1.5x** (150 pts)
* **Streak Shields:**
    * A shield is **earned** when a streak reaches 7 days.
    * A shield is **used** on the first missed day, preventing the streak from breaking.
    * You can only hold one shield per habit at a time. This enforces the "Never Miss Twice" rule.
* **Milestones (One-Off Goals):**
    * Separate from habits.
    * Have a fixed, tiered point value (e.g., Small: 150, Medium: 500, Large: 1500).
    * Points are awarded immediately upon completion.


### **7. Habit & Constraint System (The rules Object)**

This is the object inside each monthlyGoals document. It tells the getDashboardState function how to validate the habitEntries.



* **Example rules for "30 Min Movement":** \
"rules": { \
  "ui": "CHECKBOX", \
  "goal": { \
    "type": "FREQUENCY", \
    "period": "WEEKLY", \
    "target": 5 // e.g., 5 times a week \
  }, \
  "constraints": [ \
    { \
      "type": "VALUE_FREQUENCY", \
      "period": "WEEKLY", \
      "target": 3, \
      "value": "Fitness Class" \
    } \
  ] \
} \

* **How it works:** The getDashboardState function would check the habitEntries for this goal. To mark the week as "successful" for the point calculation, the user must have at least 5 total entries AND at least 3 of those entries must have the value "Fitness Class".