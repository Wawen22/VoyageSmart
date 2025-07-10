import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export type Accommodation = {
  id: string;
  trip_id: string;
  name: string;
  type: string;
  check_in_date: string | null;
  check_out_date: string | null;
  address: string | null;
  coordinates: { x: number; y: number } | null;
  coordinates_json?: string | null; // Added for database compatibility
  booking_reference: string | null;
  contact_info: string | null;
  cost: number | null;
  currency: string;
  documents: { name: string; url: string; type: string }[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AccommodationState = {
  accommodations: Accommodation[];
  loading: boolean;
  error: string | null;
  currentAccommodation: Accommodation | null;
};

const initialState: AccommodationState = {
  accommodations: [],
  loading: false,
  error: null,
  currentAccommodation: null,
};

// Cache for accommodations data to prevent redundant fetches
const accommodationsCache: Record<string, { timestamp: number, data: Accommodation[] }> = {};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Fetch accommodations for a trip
export const fetchAccommodations = createAsyncThunk(
  'accommodations/fetchAccommodations',
  async (tripId: string, { rejectWithValue }) => {
    try {
      // Check if we have cached data that's still valid
      const cachedData = accommodationsCache[tripId];
      const now = Date.now();

      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
        return cachedData.data;
      }

      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId)
        .order('check_in_date', { ascending: true });

      if (error) {
        throw error;
      }

      // Process the data to reconstruct coordinates from coordinates_json
      const processedData = data?.map(item => {
        if (item.coordinates_json) {
          try {
            return {
              ...item,
              coordinates: JSON.parse(item.coordinates_json)
            };
          } catch (e) {
            console.error('Error parsing coordinates JSON:', e);
          }
        }
        return item;
      });

      const result = processedData || [];

      // Cache the result
      accommodationsCache[tripId] = {
        timestamp: now,
        data: result
      };

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new accommodation
export const addAccommodation = createAsyncThunk(
  'accommodations/addAccommodation',
  async (accommodation: Partial<Accommodation>, { rejectWithValue }) => {
    try {
      // Store coordinates as a JSON string to avoid type issues
      let dataToInsert = { ...accommodation };

      if (dataToInsert.coordinates) {
        // Convert coordinates to a string representation
        dataToInsert = {
          ...dataToInsert,
          coordinates_json: JSON.stringify(dataToInsert.coordinates),
          coordinates: null // Set to null to avoid type issues
        };
      }

      console.log('Data to insert:', dataToInsert);

      const { data, error } = await supabase
        .from('accommodations')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error adding accommodation:', error);
        throw error;
      }

      // Reconstruct the coordinates from the JSON string
      let result = { ...data };
      if (data && data.coordinates_json) {
        try {
          result.coordinates = JSON.parse(data.coordinates_json);
        } catch (e) {
          console.error('Error parsing coordinates JSON:', e);
        }
      }

      // Invalidate cache for this trip
      if (result.trip_id) {
        delete accommodationsCache[result.trip_id];
      }

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update an accommodation
export const updateAccommodation = createAsyncThunk(
  'accommodations/updateAccommodation',
  async (
    { id, accommodation }: { id: string; accommodation: Partial<Accommodation> },
    { rejectWithValue }
  ) => {
    try {
      // Store coordinates as a JSON string to avoid type issues
      let dataToUpdate = { ...accommodation };

      if (dataToUpdate.coordinates) {
        // Convert coordinates to a string representation
        dataToUpdate = {
          ...dataToUpdate,
          coordinates_json: JSON.stringify(dataToUpdate.coordinates),
          coordinates: null // Set to null to avoid type issues
        };
      }

      console.log('Data to update:', dataToUpdate);

      const { data, error } = await supabase
        .from('accommodations')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating accommodation:', error);
        throw error;
      }

      // Reconstruct the coordinates from the JSON string
      let result = { ...data };
      if (data && data.coordinates_json) {
        try {
          result.coordinates = JSON.parse(data.coordinates_json);
        } catch (e) {
          console.error('Error parsing coordinates JSON:', e);
        }
      }

      // Invalidate cache for this trip
      if (result.trip_id) {
        delete accommodationsCache[result.trip_id];
      }

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete an accommodation
export const deleteAccommodation = createAsyncThunk(
  'accommodations/deleteAccommodation',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      // Get the trip_id before deleting to invalidate cache
      const state = getState() as { accommodations: AccommodationState };
      const accommodation = state.accommodations.accommodations.find(acc => acc.id === id);
      const tripId = accommodation?.trip_id;

      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache for this trip
      if (tripId) {
        delete accommodationsCache[tripId];
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const accommodationSlice = createSlice({
  name: 'accommodations',
  initialState,
  reducers: {
    setCurrentAccommodation: (state, action: PayloadAction<Accommodation | null>) => {
      state.currentAccommodation = action.payload;
    },
    clearAccommodations: (state) => {
      state.accommodations = [];
      state.currentAccommodation = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch accommodations
      .addCase(fetchAccommodations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccommodations.fulfilled, (state, action) => {
        state.loading = false;
        state.accommodations = action.payload;
      })
      .addCase(fetchAccommodations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add accommodation
      .addCase(addAccommodation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAccommodation.fulfilled, (state, action) => {
        state.loading = false;
        state.accommodations.push(action.payload);
      })
      .addCase(addAccommodation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update accommodation
      .addCase(updateAccommodation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccommodation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accommodations.findIndex(
          (accommodation) => accommodation.id === action.payload.id
        );
        if (index !== -1) {
          state.accommodations[index] = action.payload;
        }
        if (state.currentAccommodation?.id === action.payload.id) {
          state.currentAccommodation = action.payload;
        }
      })
      .addCase(updateAccommodation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete accommodation
      .addCase(deleteAccommodation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccommodation.fulfilled, (state, action) => {
        state.loading = false;
        state.accommodations = state.accommodations.filter(
          (accommodation) => accommodation.id !== action.payload
        );
        if (state.currentAccommodation?.id === action.payload) {
          state.currentAccommodation = null;
        }
      })
      .addCase(deleteAccommodation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentAccommodation, clearAccommodations } = accommodationSlice.actions;
export default accommodationSlice.reducer;
