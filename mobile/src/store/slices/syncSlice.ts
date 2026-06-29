import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SyncTask {
  id: string; // Unique ID for the queued task (e.g., timestamp + random)
  url: string; // API endpoint
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any; // Payload to send
  type: 'checkIn' | 'checkOut' | 'other'; // Type of task for local UI feedback
  timestamp: string; // ISO string of when the task was queued locally
  retryCount: number;
}

interface SyncState {
  queue: SyncTask[];
  isSyncing: boolean;
}

const initialState: SyncState = {
  queue: [],
  isSyncing: false,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    enqueueTask: (state, action: PayloadAction<Omit<SyncTask, 'id' | 'retryCount'>>) => {
      const newTask: SyncTask = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        retryCount: 0,
      };
      state.queue.push(newTask);
    },
    dequeueTask: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((task) => task.id !== action.payload);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const task = state.queue.find((t) => t.id === action.payload);
      if (task) {
        task.retryCount += 1;
      }
    },
    setSyncingStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
  },
});

export const { enqueueTask, dequeueTask, incrementRetry, setSyncingStatus } = syncSlice.actions;

export default syncSlice.reducer;
