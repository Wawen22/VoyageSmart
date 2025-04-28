import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface JournalEntry {
  id: string;
  trip_id: string;
  day_id: string | null;
  user_id: string;
  title: string;
  content: string;
  mood: string | null;
  location: string | null;
  coordinates: { x: number; y: number } | null;
  weather: any | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface JournalMedia {
  id: string;
  journal_entry_id: string | null;
  trip_id: string;
  day_id: string | null;
  user_id: string;
  type: 'photo' | 'video';
  url: string;
  caption: string | null;
  location: string | null;
  coordinates: { x: number; y: number } | null;
  tags: string[] | null;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface JournalState {
  entries: JournalEntry[];
  media: JournalMedia[];
  loading: boolean;
  error: string | null;
  currentEntry: JournalEntry | null;
}

const initialState: JournalState = {
  entries: [],
  media: [],
  loading: false,
  error: null,
  currentEntry: null,
};

// Async thunks
export const fetchJournalEntries = createAsyncThunk(
  'journal/fetchEntries',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trip_journal')
        .select(`
          *,
          user:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JournalEntry[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJournalMedia = createAsyncThunk(
  'journal/fetchMedia',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trip_media')
        .select(`
          *,
          user:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JournalMedia[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addJournalEntry = createAsyncThunk(
  'journal/addEntry',
  async (entry: Omit<JournalEntry, 'id' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('trip_journal')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateJournalEntry = createAsyncThunk(
  'journal/updateEntry',
  async (
    { id, ...updates }: Partial<JournalEntry> & { id: string },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('trip_journal')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJournalEntry = createAsyncThunk(
  'journal/deleteEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('trip_journal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addJournalMedia = createAsyncThunk(
  'journal/addMedia',
  async (
    {
      file,
      tripId,
      dayId,
      journalEntryId,
      caption,
      location,
      coordinates,
      tags,
    }: {
      file: File;
      tripId: string;
      dayId?: string;
      journalEntryId?: string;
      caption?: string;
      location?: string;
      coordinates?: { x: number; y: number };
      tags?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      // 1. Upload the file to storage
      const fileExt = file.name.split('.').pop();
      // Crea un nome file più sicuro con timestamp e ID casuale
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      // Non usare la struttura di cartelle per evitare problemi con le politiche RLS
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('trip-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from('trip-media')
        .getPublicUrl(filePath);

      // 3. Create the media record in the database
      const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';

      // Get the user ID in a more secure way
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Simplify the data for insertion
      const mediaData = {
        trip_id: tripId,
        user_id: userData.user.id,
        type: mediaType,
        url: urlData.publicUrl,
        // Temporarily remove fields that might cause problems
        // day_id: dayId || null,
        // journal_entry_id: journalEntryId || null,
        // caption: caption || null,
        // location: location || null,
        // coordinates: coordinates || null,
        // tags: tags || null,
      };

      // Log the data we are about to insert
      console.log('Inserting media with data:', JSON.stringify(mediaData, null, 2));

      const { data, error } = await supabase
        .from('trip_media')
        .insert(mediaData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting media:', error);
        throw error;
      }
      return data as JournalMedia;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJournalMedia = createAsyncThunk(
  'journal/deleteMedia',
  async (
    { id, url }: { id: string; url: string },
    { rejectWithValue }
  ) => {
    try {
      // 1. Delete from storage
      // Extract only the file name from the URL
      const fileName = url.split('/').pop();
      if (!fileName) {
        console.error('Invalid file URL format');
        throw new Error('Invalid file URL format');
      }

      const { error: storageError } = await supabase.storage
        .from('trip-media')
        .remove([fileName]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue anyway to delete the database record
      }

      // 2. Delete from database
      const { error } = await supabase
        .from('trip_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    setCurrentEntry: (state, action: PayloadAction<JournalEntry | null>) => {
      state.currentEntry = action.payload;
    },
    clearJournalState: (state) => {
      state.entries = [];
      state.media = [];
      state.currentEntry = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch journal entries
      .addCase(fetchJournalEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch journal media
      .addCase(fetchJournalMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJournalMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.media = action.payload;
      })
      .addCase(fetchJournalMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add journal entry
      .addCase(addJournalEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addJournalEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = [action.payload, ...state.entries];
      })
      .addCase(addJournalEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update journal entry
      .addCase(updateJournalEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJournalEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        );
        if (state.currentEntry?.id === action.payload.id) {
          state.currentEntry = action.payload;
        }
      })
      .addCase(updateJournalEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete journal entry
      .addCase(deleteJournalEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJournalEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter(entry => entry.id !== action.payload);
        if (state.currentEntry?.id === action.payload) {
          state.currentEntry = null;
        }
      })
      .addCase(deleteJournalEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add journal media
      .addCase(addJournalMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addJournalMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.media = [action.payload, ...state.media];
      })
      .addCase(addJournalMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete journal media
      .addCase(deleteJournalMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJournalMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.media = state.media.filter(media => media.id !== action.payload);
      })
      .addCase(deleteJournalMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentEntry, clearJournalState } = journalSlice.actions;
export default journalSlice.reducer;
