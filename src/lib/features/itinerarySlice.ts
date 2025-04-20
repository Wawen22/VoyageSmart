import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

// Types
export type Activity = {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
};

export type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
  created_at: string;
  updated_at: string;
};

// State interface
interface ItineraryState {
  days: ItineraryDay[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ItineraryState = {
  days: [],
  activities: [],
  loading: false,
  error: null,
};

// Async thunk for fetching trip itinerary
export const fetchTripItinerary = createAsyncThunk(
  'itinerary/fetchTripItinerary',
  async (tripId: string, { rejectWithValue }) => {
    try {
      // Fetch itinerary days
      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_date', { ascending: true });

      if (daysError) throw daysError;

      // Fetch activities for all days
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('start_time', { ascending: true });

      if (activitiesError) throw activitiesError;

      return {
        days: daysData || [],
        activities: activitiesData || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch itinerary');
    }
  }
);

// Create the slice
export const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    // Add a new day
    addDay: (state, action: PayloadAction<ItineraryDay>) => {
      state.days.push(action.payload);
      // Sort days by date
      state.days.sort((a, b) => 
        new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
      );
    },
    // Update a day
    updateDay: (state, action: PayloadAction<ItineraryDay>) => {
      const index = state.days.findIndex(day => day.id === action.payload.id);
      if (index !== -1) {
        state.days[index] = action.payload;
        // Sort days by date
        state.days.sort((a, b) => 
          new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
        );
      }
    },
    // Delete a day
    deleteDay: (state, action: PayloadAction<string>) => {
      state.days = state.days.filter(day => day.id !== action.payload);
      // Also remove activities for this day
      state.activities = state.activities.filter(activity => activity.day_id !== action.payload);
    },
    // Add a new activity
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.push(action.payload);
      // Sort activities by start time
      state.activities.sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
    },
    // Update an activity
    updateActivity: (state, action: PayloadAction<Activity>) => {
      const index = state.activities.findIndex(activity => activity.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
        // Sort activities by start time
        state.activities.sort((a, b) => {
          if (!a.start_time) return 1;
          if (!b.start_time) return -1;
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });
      }
    },
    // Delete an activity
    deleteActivity: (state, action: PayloadAction<string>) => {
      state.activities = state.activities.filter(activity => activity.id !== action.payload);
    },
    // Move an activity to a different day
    moveActivity: (state, action: PayloadAction<{ activityId: string; newDayId: string }>) => {
      const { activityId, newDayId } = action.payload;
      const activityIndex = state.activities.findIndex(activity => activity.id === activityId);
      
      if (activityIndex !== -1) {
        state.activities[activityIndex].day_id = newDayId;
      }
    },
    // Clear itinerary state
    clearItinerary: (state) => {
      state.days = [];
      state.activities = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.days = action.payload.days;
        state.activities = action.payload.activities;
      })
      .addCase(fetchTripItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  addDay,
  updateDay,
  deleteDay,
  addActivity,
  updateActivity,
  deleteActivity,
  moveActivity,
  clearItinerary,
} = itinerarySlice.actions;

// Export reducer
export default itinerarySlice.reducer;
