import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { CrewNavigator } from './CrewNavigator';
import { api } from '../services/api';
import { logout, updateProfileSuccess, User } from '../store/slices/authSlice';

const mapRole = (role?: string): User['role'] => {
  if (role === 'crew' || role === 'CREW') return 'CREW';
  if (role === 'admin' || role === 'ADMIN') return 'ADMIN';
  return 'CLIENT';
};

export const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && token) {
        try {
          // Sync data profil terbaru dari backend database
          const response = await api.get('/auth/profile');
          if (response.data.success) {
            const profile = response.data.data;
            dispatch(updateProfileSuccess({
              id: String(profile.id),
              name: profile.name,
              email: profile.email,
              role: mapRole(profile.role),
              phone: profile.phone || undefined,
              avatar_url: profile.avatar_url || undefined,
            }));
          }
        } catch (error: any) {
          if (error.message === 'Network Error' || !error.response) {
            console.log('[Auth Sync] Sedang offline, menggunakan data profil lokal.');
          } else {
            console.warn('[Auth Sync] Gagal sinkronisasi profil:', error.message);
          }
          // Jika token tidak valid / expired (401), paksa logout
          if (error.response && error.response.status === 401) {
            dispatch(logout());
          }
        }
      }
    };

    checkProfile();
  }, [isAuthenticated, token]);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.role === 'CLIENT' || user?.role === 'ADMIN' ? (
        <ClientNavigator />
      ) : (
        <CrewNavigator />
      )}
    </NavigationContainer>
  );
};
