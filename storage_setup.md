# Supabase Storage Setup — Avatar Uploads

Run these steps **once** in your Supabase project to enable profile photo uploads.

---

## Step 1 — Create the `avatars` bucket

1. Go to your Supabase dashboard
2. Left sidebar → **Storage**
3. Click **New bucket**
4. Name: `avatars`
5. Toggle **Public bucket** → ON
6. Click **Create bucket**

> Public bucket means the avatar URLs are readable without authentication,
> which is needed to show profile pictures to other users (leaderboard, community).

---

## Step 2 — Set Storage RLS policies

Go to **Storage → Policies** and create the following policies on the `avatars` bucket.

### 2a — Anyone can read avatars (public)

| Field | Value |
|-------|-------|
| Policy name | `Public avatar read` |
| Operation | `SELECT` |
| Target roles | *(leave blank = public)* |
| Expression | `true` |

### 2b — Authenticated users can upload their own avatar

| Field | Value |
|-------|-------|
| Policy name | `Users can upload own avatar` |
| Operation | `INSERT` |
| Target roles | `authenticated` |
| Expression | `(storage.foldername(name))[1] = auth.uid()::text` |

### 2c — Authenticated users can update/replace their own avatar

| Field | Value |
|-------|-------|
| Policy name | `Users can update own avatar` |
| Operation | `UPDATE` |
| Target roles | `authenticated` |
| Expression | `(storage.foldername(name))[1] = auth.uid()::text` |

### 2d — Authenticated users can delete their own avatar

| Field | Value |
|-------|-------|
| Policy name | `Users can delete own avatar` |
| Operation | `DELETE` |
| Target roles | `authenticated` |
| Expression | `(storage.foldername(name))[1] = auth.uid()::text` |

---

## Step 3 — SQL shortcut (alternative to Step 2)

If you prefer, run this in the **SQL Editor** instead of clicking through the UI:

```sql
-- Allow public read
create policy "Public avatar read"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload into their own folder
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to replace their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## How it works

- Files are stored at path `{userId}/avatar.{ext}` inside the `avatars` bucket
- The public URL is saved to `profiles.avatar_url` automatically after upload
- A cache-busting query parameter (`?t=timestamp`) is appended so the browser
  shows the new photo immediately without a hard refresh
- Client-side checks: only JPG / PNG / WebP / GIF, maximum **5 MB**
- Uploading again replaces the previous file (upsert)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `new row violates row-level security` | The RLS policies in Step 2/3 weren't applied |
| `The resource already exists` | Normal — the upsert option handles this automatically |
| `Bucket not found` | The bucket name must be exactly `avatars` (lowercase) |
| Image doesn't update after upload | Hard-refresh (Ctrl+Shift+R) — though the cache-bust param should prevent this |
