import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export type TransportationStop = {
  id: string;
  transportation_id: string;
  location: string;
  coordinates: { x: number; y: number } | null;
  coordinates_json?: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Transportation = {
  id: string;
  trip_id: string;
  day_id: string | null;
  type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
  provider: string | null;
  booking_reference: string | null;
  departure_time: string | null;
  departure_location: string | null;
  departure_coordinates: { x: number; y: number } | null;
  departure_coordinates_json?: string | null;
  arrival_time: string | null;
  arrival_location: string | null;
  arrival_coordinates: { x: number; y: number } | null;
  arrival_coordinates_json?: string | null;
  cost: number | null;
  currency: string;
  documents: { name: string; url: string; type: string }[];
  notes: string | null;
  status: 'confirmed' | 'pending' | 'cancelled' | null;
  created_at: string;
  updated_at: string;
  stops?: TransportationStop[];
};

type TransportationState = {
  transportations: Transportation[];
  loading: boolean;
  error: string | null;
  currentTransportation: Transportation | null;
};

const initialState: TransportationState = {
  transportations: [],
  loading: false,
  error: null,
  currentTransportation: null,
};

// Fetch transportations for a trip
export const fetchTransportations = createAsyncThunk(
  'transportations/fetchTransportations',
  async (tripId: string, { rejectWithValue }) => {
    try {
      // Fetch transportations
      const { data: transportations, error: transportationsError } = await supabase
        .from('transportation')
        .select('*')
        .eq('trip_id', tripId)
        .order('departure_time', { ascending: true });

      if (transportationsError) {
        console.error('Error fetching transportations:', transportationsError);
        throw transportationsError;
      }

      // Process transportations to reconstruct coordinates from JSON
      const processedTransportations = transportations?.map(item => {
        const transportation: any = { ...item };
        
        // Parse departure coordinates
        if (item.departure_coordinates_json) {
          try {
            transportation.departure_coordinates = JSON.parse(item.departure_coordinates_json);
          } catch (e) {
            console.error('Error parsing departure coordinates JSON:', e);
          }
        }
        
        // Parse arrival coordinates
        if (item.arrival_coordinates_json) {
          try {
            transportation.arrival_coordinates = JSON.parse(item.arrival_coordinates_json);
          } catch (e) {
            console.error('Error parsing arrival coordinates JSON:', e);
          }
        }
        
        return transportation;
      });

      // Fetch stops for each transportation
      const transportationsWithStops = await Promise.all(
        processedTransportations.map(async (transportation) => {
          const { data: stops, error: stopsError } = await supabase
            .from('transportation_stops')
            .select('*')
            .eq('transportation_id', transportation.id)
            .order('arrival_time', { ascending: true });

          if (stopsError) {
            console.error('Error fetching stops:', stopsError);
            return transportation;
          }

          // Process stops to reconstruct coordinates from JSON
          const processedStops = stops?.map(stop => {
            const processedStop: any = { ...stop };
            
            if (stop.coordinates_json) {
              try {
                processedStop.coordinates = JSON.parse(stop.coordinates_json);
              } catch (e) {
                console.error('Error parsing stop coordinates JSON:', e);
              }
            }
            
            return processedStop;
          });

          return {
            ...transportation,
            stops: processedStops || [],
          };
        })
      );

      return transportationsWithStops || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new transportation
export const addTransportation = createAsyncThunk(
  'transportations/addTransportation',
  async (transportation: Partial<Transportation>, { rejectWithValue }) => {
    try {
      // Prepare data for insertion
      const dataToInsert = { ...transportation };
      
      // Convert coordinates to JSON strings
      if (dataToInsert.departure_coordinates) {
        dataToInsert.departure_coordinates_json = JSON.stringify(dataToInsert.departure_coordinates);
        delete dataToInsert.departure_coordinates;
      }
      
      if (dataToInsert.arrival_coordinates) {
        dataToInsert.arrival_coordinates_json = JSON.stringify(dataToInsert.arrival_coordinates);
        delete dataToInsert.arrival_coordinates;
      }
      
      // Extract stops to insert separately
      const stops = dataToInsert.stops;
      delete dataToInsert.stops;

      // Insert transportation
      const { data, error } = await supabase
        .from('transportation')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error adding transportation:', error);
        throw error;
      }

      // Insert stops if any
      let stopsData = [];
      if (stops && stops.length > 0) {
        const stopsToInsert = stops.map(stop => ({
          transportation_id: data.id,
          location: stop.location,
          coordinates_json: stop.coordinates ? JSON.stringify(stop.coordinates) : null,
          arrival_time: stop.arrival_time,
          departure_time: stop.departure_time,
          notes: stop.notes,
        }));

        const { data: insertedStops, error: stopsError } = await supabase
          .from('transportation_stops')
          .insert(stopsToInsert)
          .select();

        if (stopsError) {
          console.error('Error adding transportation stops:', stopsError);
          // We'll continue even if stops insertion fails
        } else {
          stopsData = insertedStops;
        }
      }

      // Reconstruct the result with parsed coordinates
      const result: any = { ...data };
      
      if (data.departure_coordinates_json) {
        try {
          result.departure_coordinates = JSON.parse(data.departure_coordinates_json);
        } catch (e) {
          console.error('Error parsing departure coordinates JSON:', e);
        }
      }
      
      if (data.arrival_coordinates_json) {
        try {
          result.arrival_coordinates = JSON.parse(data.arrival_coordinates_json);
        } catch (e) {
          console.error('Error parsing arrival coordinates JSON:', e);
        }
      }
      
      // Add stops to the result
      result.stops = stopsData.map((stop: any) => {
        const processedStop: any = { ...stop };
        
        if (stop.coordinates_json) {
          try {
            processedStop.coordinates = JSON.parse(stop.coordinates_json);
          } catch (e) {
            console.error('Error parsing stop coordinates JSON:', e);
          }
        }
        
        return processedStop;
      });

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update a transportation
export const updateTransportation = createAsyncThunk(
  'transportations/updateTransportation',
  async (
    { id, transportation }: { id: string; transportation: Partial<Transportation> },
    { rejectWithValue }
  ) => {
    try {
      // Prepare data for update
      const dataToUpdate = { ...transportation };
      
      // Convert coordinates to JSON strings
      if (dataToUpdate.departure_coordinates) {
        dataToUpdate.departure_coordinates_json = JSON.stringify(dataToUpdate.departure_coordinates);
        delete dataToUpdate.departure_coordinates;
      }
      
      if (dataToUpdate.arrival_coordinates) {
        dataToUpdate.arrival_coordinates_json = JSON.stringify(dataToUpdate.arrival_coordinates);
        delete dataToUpdate.arrival_coordinates;
      }
      
      // Extract stops to update separately
      const stops = dataToUpdate.stops;
      delete dataToUpdate.stops;

      // Update transportation
      const { data, error } = await supabase
        .from('transportation')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transportation:', error);
        throw error;
      }

      // Handle stops update
      let stopsData = [];
      if (stops) {
        // First delete all existing stops
        const { error: deleteError } = await supabase
          .from('transportation_stops')
          .delete()
          .eq('transportation_id', id);

        if (deleteError) {
          console.error('Error deleting transportation stops:', deleteError);
          // Continue even if deletion fails
        }

        // Then insert new stops
        if (stops.length > 0) {
          const stopsToInsert = stops.map(stop => ({
            transportation_id: id,
            location: stop.location,
            coordinates_json: stop.coordinates ? JSON.stringify(stop.coordinates) : null,
            arrival_time: stop.arrival_time,
            departure_time: stop.departure_time,
            notes: stop.notes,
          }));

          const { data: insertedStops, error: stopsError } = await supabase
            .from('transportation_stops')
            .insert(stopsToInsert)
            .select();

          if (stopsError) {
            console.error('Error adding transportation stops:', stopsError);
            // Continue even if insertion fails
          } else {
            stopsData = insertedStops;
          }
        }
      }

      // Reconstruct the result with parsed coordinates
      const result: any = { ...data };
      
      if (data.departure_coordinates_json) {
        try {
          result.departure_coordinates = JSON.parse(data.departure_coordinates_json);
        } catch (e) {
          console.error('Error parsing departure coordinates JSON:', e);
        }
      }
      
      if (data.arrival_coordinates_json) {
        try {
          result.arrival_coordinates = JSON.parse(data.arrival_coordinates_json);
        } catch (e) {
          console.error('Error parsing arrival coordinates JSON:', e);
        }
      }
      
      // Add stops to the result
      result.stops = stopsData.map((stop: any) => {
        const processedStop: any = { ...stop };
        
        if (stop.coordinates_json) {
          try {
            processedStop.coordinates = JSON.parse(stop.coordinates_json);
          } catch (e) {
            console.error('Error parsing stop coordinates JSON:', e);
          }
        }
        
        return processedStop;
      });

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete a transportation
export const deleteTransportation = createAsyncThunk(
  'transportations/deleteTransportation',
  async (id: string, { rejectWithValue }) => {
    try {
      // Delete transportation (stops will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('transportation')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transportation:', error);
        throw error;
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const transportationSlice = createSlice({
  name: 'transportations',
  initialState,
  reducers: {
    setCurrentTransportation: (state, action: PayloadAction<Transportation | null>) => {
      state.currentTransportation = action.payload;
    },
    clearTransportationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transportations
      .addCase(fetchTransportations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransportations.fulfilled, (state, action) => {
        state.transportations = action.payload;
        state.loading = false;
      })
      .addCase(fetchTransportations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add transportation
      .addCase(addTransportation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransportation.fulfilled, (state, action) => {
        state.transportations.push(action.payload);
        state.loading = false;
      })
      .addCase(addTransportation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update transportation
      .addCase(updateTransportation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransportation.fulfilled, (state, action) => {
        const index = state.transportations.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transportations[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateTransportation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete transportation
      .addCase(deleteTransportation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransportation.fulfilled, (state, action) => {
        state.transportations = state.transportations.filter(t => t.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteTransportation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTransportation, clearTransportationError } = transportationSlice.actions;

export default transportationSlice.reducer;
