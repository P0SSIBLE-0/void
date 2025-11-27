-- 1. Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 2. Create the enum type for item categories
create type item_type as enum ('link', 'image', 'text', 'pdf');

-- 3. Create the items table
create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Matches better-auth user.id (which is text by default)
  url text,
  type item_type not null default 'link',
  title text,
  description text,
  content text,
  summary text,
  tags text[], -- Array of text for tags
  embedding vector(768), -- Gemini embedding dimension
  meta jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table items enable row level security;

-- 5. Create RLS Policies
-- Policy: Users can select their own items
create policy "Users can view their own items"
  on items for select
  using ( auth.uid()::text = user_id );

-- Policy: Users can insert their own items
create policy "Users can insert their own items"
  on items for insert
  with check ( auth.uid()::text = user_id );

-- Policy: Users can update their own items
create policy "Users can update their own items"
  on items for update
  using ( auth.uid()::text = user_id );

-- Policy: Users can delete their own items
create policy "Users can delete their own items"
  on items for delete
  using ( auth.uid()::text = user_id );

-- 6. Create an index for faster vector similarity search
-- This uses the IVFFlat index type, which is good for larger datasets. 
-- For smaller datasets, you might not strictly need it yet, but it's good practice.
-- Note: You need some data in the table for the index to be built effectively, 
-- but creating the definition now is fine.
create index on items using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
