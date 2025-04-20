# Supabase Setup Instructions for VoyageSmart

This document provides step-by-step instructions for setting up the Supabase project for VoyageSmart.

## 1. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Click "New Project"
3. Enter project details:
   - Name: VoyageSmart
   - Database Password: (create a secure password)
   - Region: Choose the region closest to your users
4. Click "Create New Project"

## 2. Set Up Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `schema.sql` into the SQL Editor
3. Run the SQL script to create all tables, policies, and functions

## 3. Configure Storage Buckets

Create the following storage buckets:

1. Navigate to Storage in your Supabase dashboard
2. Create the following buckets:
   - `trip_documents`: For storing travel documents (tickets, vouchers, etc.)
   - `trip_receipts`: For storing receipts and invoices
   - `trip_media`: For storing photos and videos
   - `user_avatars`: For storing user profile images

For each bucket, set up the following policies:

### trip_documents Bucket Policies

```sql
-- Anyone can view trip documents if they are a participant of the trip
CREATE POLICY "Trip participants can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trip_documents' AND
  EXISTS (
    SELECT 1 FROM public.trip_participants
    JOIN public.trips ON trip_participants.trip_id = trips.id
    WHERE trips.id::text = (storage.foldername(name))[1]
    AND trip_participants.user_id = auth.uid()
  )
);

-- Only trip participants can upload documents
CREATE POLICY "Trip participants can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trip_documents' AND
  EXISTS (
    SELECT 1 FROM public.trip_participants
    JOIN public.trips ON trip_participants.trip_id = trips.id
    WHERE trips.id::text = (storage.foldername(name))[1]
    AND trip_participants.user_id = auth.uid()
  )
);

-- Only the document owner or trip owner can delete documents
CREATE POLICY "Document owners can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trip_documents' AND
  (
    -- Document owner
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Trip owner
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id::text = (storage.foldername(name))[1]
      AND trips.owner_id = auth.uid()
    )
  )
);
```

Apply similar policies to the other buckets.

## 4. Set Up Authentication

1. Navigate to Authentication in your Supabase dashboard
2. Configure Email Auth:
   - Enable "Email Signup"
   - Configure email templates for confirmation, magic link, etc.
3. Set up OAuth Providers (optional):
   - Google
   - GitHub
   - Facebook

## 5. Create Edge Functions (for later phases)

For the MVP phase, we won't need Edge Functions yet, but they will be used in later phases for:

- `optimize_itinerary_route`: To optimize daily routes
- `generate_trip_summary`: To generate automatic summaries
- `check_accommodation_availability`: To verify accommodation availability
- `invite_users_to_trip`: To manage invitations and permissions

## 6. Get API Keys

1. Go to Project Settings > API
2. Copy the URL and anon key
3. Add these to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## 7. Enable Realtime

1. Go to Database > Replication
2. Enable realtime for the following tables:
   - trips
   - trip_participants
   - itinerary_days
   - activities
   - expenses
   - expense_participants

## 8. Test the Setup

1. Use the Supabase client in your application to test authentication
2. Verify that you can create and query data with the appropriate permissions
3. Test storage uploads and downloads
4. Verify that realtime updates are working
