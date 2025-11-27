-- Complete Schema Reset for "items" table
-- This handles the policy dependency error by dropping everything first.

-- 1. Drop Policies First
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

-- 2. Drop the Foreign Key
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_user_id_fkey;

-- 3. Alter the Column Type
-- If this fails due to data conversion, use: TRUNCATE TABLE items;
ALTER TABLE items ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 4. Add Foreign Key to Supabase Auth
ALTER TABLE items ADD CONSTRAINT items_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Re-create Policies
CREATE POLICY "Users can view their own items"
  ON items FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own items"
  ON items FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own items"
  ON items FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own items"
  ON items FOR DELETE
  USING ( auth.uid() = user_id );
