-- 1. Add secret_details to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS secret_details TEXT;

-- 2. Add is_private to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 3. Update comments RLS policy to allow private comments to be seen by the post owner or comment creator
-- First, drop the existing select policy if it exists (assuming it was called 'Anyone can view comments')
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON comments;

-- Create the new policy
CREATE POLICY "View comments"
ON comments FOR SELECT
USING (
  is_private = false 
  OR user_id = auth.uid() 
  OR post_id IN (SELECT id FROM posts WHERE user_id = auth.uid())
);

-- Ensure users can insert comments
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments." ON comments;

CREATE POLICY "Insert comments"
ON comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- 4. Update the delete_user_post function to also ensure it doesn't fail if we added new constraints, though the current one is fine unless cascade behaves weirdly. (The existing one is fine).
