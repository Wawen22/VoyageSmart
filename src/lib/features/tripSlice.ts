import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

interface TripState {
  trips: Trip[];
  loading: boolean;
  currentTrip: Trip | null;
}

const initialState: TripState = {
  trips: [],
  loading: false,
  currentTrip: null,
};

export const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      state.trips = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCurrentTrip: (state, action: PayloadAction<Trip | null>) => {
      state.currentTrip = action.payload;
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.trips.push(action.payload);
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id);
      if (index !== -1) {
        state.trips[index] = action.payload;
      }
    },
    removeTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter(trip => trip.id !== action.payload);
    },
  },
});

export const { 
  setTrips, 
  setLoading, 
  setCurrentTrip, 
  addTrip, 
  updateTrip, 
  removeTrip 
} = tripSlice.actions;

export default tripSlice.reducer;
