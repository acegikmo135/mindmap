# Supabase Authentication & Database Setup Guide

This guide will walk you through setting up Supabase for your CogniStruct application, including new features for Profile, Mind Maps, and Chapter-specific Chat History.

## Prerequisites

1.  A [Supabase](https://supabase.com/) account.
2.  A new Supabase project.

## Step 1: Create a New Project

1.  Log in to your Supabase dashboard.
2.  Click "New Project".
3.  Enter a name (e.g., "CogniStruct").
4.  Set a database password (save this securely).
5.  Select a region close to your users.
6.  Click "Create new project".

## Step 2: Get API Keys

1.  Once your project is ready, go to **Project Settings** (gear icon) -> **API**.
2.  Copy the **Project URL**.
3.  Copy the **anon public** key.

## Step 3: Configure Environment Variables

1.  In your project root, create a `.env` file (if it doesn't exist).
2.  Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Note:** Ensure these variables are prefixed with `VITE_` so they are accessible in the React app.

## Step 4: Set Up Database Schema

Go to the **SQL Editor** in your Supabase dashboard and run the following SQL script to create or update the necessary tables and security policies.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DROP EXISTING TABLES IN CORRECT ORDER (Respecting Foreign Keys)
drop table if exists public.chat_history cascade;
drop table if exists public.user_data cascade;
drop table if exists public.profiles cascade;

-- 1. Create Profiles Table
-- Stores user profile information like name, avatar, hobbies, and grade.
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  hobbies text,
  grade text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- 2. Create User Data Table
-- Stores application state: chapter progress, flashcards, settings, and mind map history.
create table public.user_data (
  user_id uuid not null references auth.users on delete cascade,
  chapters jsonb default '[]'::jsonb,
  flashcards jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  mind_maps jsonb default '{}'::jsonb, -- Stores map history by chapterId
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id)
);

-- 3. Create Chat History Table
-- Stores DoubtSolver messages per chapter.
create table public.chat_history (
  user_id uuid not null references auth.users on delete cascade,
  messages jsonb default '{}'::jsonb, -- Object: { "chapterId": [messages] }
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id)
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.chat_history enable row level security;

-- 5. Create Policies (Idempotent)

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- User Data policies
drop policy if exists "Users can view own data." on user_data;
create policy "Users can view own data." on user_data for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert own data." on user_data;
create policy "Users can insert own data." on user_data for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update own data." on user_data;
create policy "Users can update own data." on user_data for update using ( auth.uid() = user_id );

-- Chat History policies
drop policy if exists "Users can view own chat history." on chat_history;
create policy "Users can view own chat history." on chat_history for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert own chat history." on chat_history;
create policy "Users can insert own chat history." on chat_history for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update own chat history." on chat_history;
create policy "Users can update own chat history." on chat_history for update using ( auth.uid() = user_id );

-- 6. Create Trigger for New Users
-- This automatically creates rows in profiles, user_data, and chat_history when a user signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  insert into public.user_data (user_id)
  values (new.id);
  
  insert into public.chat_history (user_id)
  values (new.id);
  
  return new;
end;
$$;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Step 5: Enable Email Auth

1.  Go to **Authentication** -> **Providers**.
2.  Ensure **Email** is enabled.
3.  (Optional) Disable "Confirm email" in **Authentication** -> **URL Configuration** if you want users to log in immediately without verifying email (useful for testing).

## Step 6: Verify Setup

1.  Start your development server (`npm run dev`).
2.  You should see a Login screen.
3.  Sign up with a test email.
4.  Check your Supabase tables (`profiles`, `user_data`, `chat_history`) to ensure rows were created automatically.
