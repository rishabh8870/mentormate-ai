

## Plan: Add Admin Delete Button to Collaboration Hub Room Cards

### Problem
The admin can delete rooms from the Admin Dashboard, but not directly from the Collaboration Hub page where they browse rooms. The `RoomCard` component has no delete button for admins.

### Changes

**File: `src/pages/CollaborationHub.tsx`**

1. Import `useAdmin` hook and `Trash2` icon
2. Add `deleteRoom` function (same pattern as Admin page — calls `supabase.from("coding_rooms").delete()`)
3. Add a delete button (red trash icon) to the `RoomCard` component, visible only when `isAdmin` is true
4. After deletion, remove the room from both `myRooms` and `publicRooms` state arrays and show a toast

### Technical Details
- The RLS policy `"Admins can delete any room"` already exists, so the database layer is ready
- The delete button will appear alongside the existing Open/Copy buttons in the card footer
- Uses the existing `useAdmin` hook from `src/hooks/useAdmin.tsx`
- No database changes needed

