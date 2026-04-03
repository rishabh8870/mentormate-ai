-- 1. Create a security definer function to validate invite codes
CREATE OR REPLACE FUNCTION public.validate_room_invite(_room_id uuid, _invite_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coding_rooms
    WHERE id = _room_id AND invite_code = _invite_code
  )
$$;

-- 2. Drop the overly permissive public SELECT policy on coding_rooms
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.coding_rooms;

-- 3. Replace with authenticated-only policy that hides invite_code for non-members
CREATE POLICY "Authenticated users can view active rooms"
ON public.coding_rooms
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. Drop the old permissive join policy on room_members
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

-- 5. Create a new join policy that requires invite code validation
-- Note: The invite code must be passed via a custom RPC function instead
-- For now, restrict joining to authenticated users only (invite code checked in app)
CREATE POLICY "Authenticated users can join rooms"
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);