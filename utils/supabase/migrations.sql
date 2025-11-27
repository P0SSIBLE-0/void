-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "vector";


-- Table: user
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL
);

-- Table: session
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Table: account
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL
);

-- Table: verification
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
);

-- ==========================================
-- 2. App Specific Schema (Void)
-- ==========================================

-- Enum: item_type
DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('link', 'image', 'text', 'pdf');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: items
CREATE TABLE IF NOT EXISTS "items" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "url" TEXT,
  "type" item_type NOT NULL DEFAULT 'link',
  "title" TEXT,
  "description" TEXT,
  "content" TEXT,
  "summary" TEXT,
  "tags" TEXT[],
  "embedding" vector(768),
  "meta" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for Vector Search
CREATE INDEX IF NOT EXISTS items_embedding_idx ON items USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS on items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items
-- Note: These policies work if you are using Supabase Auth.
-- If using Better Auth exclusively with manual querying, these might be bypassed by the service role 
-- or need to be adjusted if you find a way to sync Better Auth sessions to Postgres RLS variables.
-- For now, we keep them as standard practice.

CREATE POLICY "Users can view their own items"
  ON items FOR SELECT
  USING ( user_id = current_setting('app.current_user_id', true) );
  -- Note: You would need to set 'app.current_user_id' in your database transaction for this to work with Better Auth.
  -- Alternatively, handle authorization in the application layer (API).
