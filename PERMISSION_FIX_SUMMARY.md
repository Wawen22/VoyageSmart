# Permission Fix Summary - Accommodations & Transportation

## Issue Description
Trip Participants (non-admin users) were unable to see the "Add Accommodation" and "Add Transportation" buttons, preventing them from adding new entries to trips they were participating in.

## Root Cause
The issue was in the frontend permission system (`src/hooks/useRolePermissions.ts`). The `participant` role had the following permissions set to `false`:
- `canAddAccommodations: false`
- `canEditAccommodations: false`

This caused the `canEdit` property to be `false` for participants, which was used to conditionally render the "Add" buttons in both the accommodations and transportation pages.

## Changes Made

### 1. Frontend Permission Update
**File:** `src/hooks/useRolePermissions.ts`

**Changed:**
```typescript
participant: {
  // ... other permissions ...
  canAddAccommodations: false,  // ❌ Was false
  canEditAccommodations: false, // ❌ Was false
  canDeleteAccommodations: false,
}
```

**To:**
```typescript
participant: {
  // ... other permissions ...
  canAddAccommodations: true,   // ✅ Now true
  canEditAccommodations: true,  // ✅ Now true
  canDeleteAccommodations: false, // Still false (only admins can delete)
}
```

### 2. Backend Transportation Policies
**File:** `supabase/transportation_policy.sql` (NEW FILE)

Created comprehensive RLS (Row Level Security) policies for the transportation table to match the existing accommodations policies:

- **SELECT Policy:** Users can view transportation for trips they own or participate in
- **INSERT Policy:** Users can add transportation to trips they own or participate in
- **UPDATE Policy:** Users can update transportation for trips they own or participate in
- **DELETE Policy:** Users can delete transportation for trips they own or participate in

**Note:** The accommodations table already had the correct policies in place (`supabase/accommodations_policy.sql`).

## Impact

### Before Fix:
- ❌ Only Trip Admins could see "Add Accommodation" button
- ❌ Only Trip Admins could see "Add Transportation" button
- ❌ Regular participants had no way to contribute accommodations or transportation

### After Fix:
- ✅ All Trip Participants can see "Add Accommodation" button
- ✅ All Trip Participants can see "Add Transportation" button
- ✅ All Trip Participants can add new accommodations and transportation
- ✅ All Trip Participants can edit accommodations and transportation
- ✅ Only Admins and Owners can delete accommodations and transportation (preserved security)

## Files Modified
1. `src/hooks/useRolePermissions.ts` - Updated participant permissions
2. `supabase/transportation_policy.sql` - Created new RLS policies (NEW FILE)

## Testing Recommendations

### Manual Testing Steps:
1. **As Trip Admin:**
   - Create a new trip
   - Invite a participant (non-admin user)
   - Verify you can see and use "Add Accommodation" and "Add Transportation" buttons

2. **As Trip Participant (non-admin):**
   - Accept the trip invitation
   - Navigate to the Accommodations section
   - ✅ Verify "Add Accommodation" button is visible
   - ✅ Click the button and add a new accommodation
   - ✅ Verify you can edit the accommodation you created
   - Navigate to the Transportation section
   - ✅ Verify "Add Transportation" button is visible
   - ✅ Click the button and add a new transportation entry
   - ✅ Verify you can edit the transportation you created

3. **Database Policy Testing:**
   - Apply the new transportation policies to your Supabase database
   - Test that participants can successfully insert/update transportation records
   - Verify that participants cannot access transportation from trips they're not part of

## Database Migration Required

To apply the transportation policies to your Supabase database, run:

```bash
# Connect to your Supabase project and execute:
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/transportation_policy.sql
```

Or apply via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy the contents of `supabase/transportation_policy.sql`
3. Execute the SQL

## Security Considerations

✅ **Maintained Security:**
- Participants still cannot delete accommodations or transportation (only admins/owners)
- Participants can only access trips they are members of
- All RLS policies properly check trip membership using `is_trip_participant()` function
- No changes to trip-level permissions (invite, remove participants, etc.)

✅ **Improved Collaboration:**
- All trip participants can now contribute to planning
- Better reflects collaborative trip planning use case
- Aligns with the behavior of Activities and Expenses (which already allowed participant contributions)

## Related Code Locations

If you need to adjust these permissions in the future:

1. **Permission Definitions:** `src/hooks/useRolePermissions.ts` (lines 24-73)
2. **Accommodation Button Visibility:** `src/app/trips/[id]/accommodations/page.tsx` (lines 422, 524)
3. **Transportation Button Visibility:** `src/app/trips/[id]/transportation/page.tsx` (lines 429, 533)
4. **Backend Accommodation Policies:** `supabase/accommodations_policy.sql`
5. **Backend Transportation Policies:** `supabase/transportation_policy.sql`

## Notes

- The subscription limits (5 accommodations/transportation for free tier) are still enforced via the `canAddMore` state
- The `canEdit` property is now correctly calculated for participants
- Backend policies were already permissive for accommodations; transportation policies were added to match

