-- 1. Add recipient_id to the comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);

-- 2. Drop the previous View comments policy
DROP POLICY IF EXISTS "View comments" ON comments;

-- 3. Create the new updated policy that includes recipient_id
CREATE POLICY "View comments"
ON comments FOR SELECT
USING (
  is_private = false 
  OR user_id = auth.uid() 
  OR recipient_id = auth.uid()
  OR post_id IN (SELECT id FROM posts WHERE user_id = auth.uid())
);
