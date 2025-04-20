import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './features/authSlice';
import tripReducer from './features/tripSlice';
import itineraryReducer from './features/itinerarySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
    itinerary: itineraryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
