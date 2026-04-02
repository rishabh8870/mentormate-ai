## Plan

### 1. Database Changes (Migration)
- Create `user_roles` table (admin role management)
- Create `coding_sessions` table (track user coding time per room)
- Add RLS policies for both tables

### 2. Admin Page
- `/admin` route, only accessible to users with admin role
- Dashboard showing all coding rooms, users
- Ability to delete any coding room
- Create new rooms directly

### 3. Coding Timer
- Timer component in the CodingRoom page
- Start/stop button for users
- Auto-stop after 3 minutes of no activity (no mouse/keyboard)
- Saves session duration to `coding_sessions` table

### 4. Profile Updates
- Show total coding time on profile page
- Show recent sessions breakdown

### 5. Navbar Update
- Show "Admin" link only for admin users
