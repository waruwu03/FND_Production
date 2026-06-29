import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'CREW' | 'ADMIN';
  phone?: string;
  avatar_url?: string;
  push_notif?: boolean;
  email_notif?: boolean;
  dark_mode?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string; refreshToken?: string | null }>) {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
    },
    tokenRefreshed(state, action: PayloadAction<{ token: string; refreshToken?: string | null }>) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || state.refreshToken;
      state.isAuthenticated = true;
    },
    loginFailure(state) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      // Hapus token dari AsyncStorage
      AsyncStorage.removeItem('token').catch(() => {});
      AsyncStorage.removeItem('refreshToken').catch(() => {});
    },
    updateProfileSuccess(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, tokenRefreshed, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
