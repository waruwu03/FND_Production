import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { store } from '../store';
import { logout, tokenRefreshed } from '../store/slices/authSlice';

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default: URL backend production di Render
  return 'https://fnd-production-backend.onrender.com/api';
};

const BASE_URL = getBaseUrl();

export const getAssetUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL.replace(/\/api\/?$/, '')}${url}`;
};

export { BASE_URL };

export const getToken = () => AsyncStorage.getItem('token');

// Upload file menggunakan native fetch (bukan axios) agar multipart boundary otomatis diisi
export async function uploadFormData(path: string, formData: FormData): Promise<any> {
  const token = await AsyncStorage.getItem('token');
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // TIDAK set Content-Type - browser/RN otomatis isi boundary multipart/form-data
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    const msg = data?.error || data?.message || `Error ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 menit — Render Free Tier butuh ~60-90 detik untuk bangun dari sleep
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000,
  });

  const payload = response.data?.data || response.data;
  const accessToken = payload?.accessToken || payload?.token;
  const nextRefreshToken = payload?.refreshToken;

  if (!accessToken) return null;

  await AsyncStorage.setItem('token', accessToken);
  if (nextRefreshToken) {
    await AsyncStorage.setItem('refreshToken', nextRefreshToken);
  }

  store.dispatch(tokenRefreshed({ token: accessToken, refreshToken: nextRefreshToken }));
  return accessToken;
}

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Jika Content-Type di-set undefined (sengaja dihapus untuk multipart upload),
    // hapus dari headers agar React Native bisa set boundary multipart/form-data otomatis.
    if (config.headers && config.headers['Content-Type'] === undefined) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise || refreshAccessToken();
      const accessToken = await refreshPromise;
      refreshPromise = null;

      if (!accessToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      store.dispatch(logout());
      return Promise.reject(refreshError);
    }
  }
);
