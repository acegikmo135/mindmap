-- ==========================================
-- CogniStruct Supabase Database Schema
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
-- Stores user profile information (name, grade, school, etc.)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  grade text,
  school text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );


-- 2. User Data Table
-- Stores the user's learning progress, chapters, flashcards, mind maps, and settings
create table public.user_data (
  user_id uuid references auth.users on delete cascade not null primary key,
  chapters jsonb default '[]'::jsonb,
  flashcards jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  mind_maps jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_data enable row level security;

create policy "Users can view own user data."
  on user_data for select
  using ( auth.uid() = user_id );

create policy "Users can insert own user data."
  on user_data for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own user data."
  on user_data for update
  using ( auth.uid() = user_id );


-- 3. Chat History Table
-- Stores the AI Doubt Solver conversation history per chapter
create table public.chat_history (
  user_id uuid references auth.users on delete cascade not null primary key,
  messages jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.chat_history enable row level security;

create policy "Users can view own chat history."
  on chat_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert own chat history."
  on chat_history for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own chat history."
  on chat_history for update
  using ( auth.uid() = user_id );


-- 4. Friend Requests Table
-- Manages the community connections between students
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;

create policy "Users can view their friend requests."
  on friend_requests for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can insert friend requests."
  on friend_requests for insert
  with check ( auth.uid() = sender_id );

create policy "Users can update their friend requests."
  on friend_requests for update
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can delete their friend requests."
  on friend_requests for delete
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

-- 5. Enable Realtime
-- Allows the app to listen to changes in profiles and friend requests instantly
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table friend_requests;
