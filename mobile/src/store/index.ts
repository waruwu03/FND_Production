import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import syncReducer from './slices/syncSlice';
import { apiSlice } from '../services/apiSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated'], // field yang disimpan
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const syncPersistConfig = {
  key: 'sync',
  storage: AsyncStorage,
  whitelist: ['queue'],
};

const persistedSyncReducer = persistReducer(syncPersistConfig, syncReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    sync: persistedSyncReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
