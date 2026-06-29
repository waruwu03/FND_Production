import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert as NativeAlert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../store';
import { logout, updateProfileSuccess } from '../../store/slices/authSlice';
import { api } from '../../services/api';
import { FndHeader } from '../../components/FndUi';

export const PengaturanScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();

  const [notifPush, setNotifPush] = useState(user?.push_notif ?? true);
  const [notifEmail, setNotifEmail] = useState(user?.email_notif ?? false);
  const [darkMode, setDarkMode] = useState(user?.dark_mode ?? false);
  const [saving, setSaving] = useState(false);

  const handleGantiPassword = () => {
    NativeAlert.prompt(
      'Ganti Password',
      'Masukkan password saat ini:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjut',
          onPress: (currentPassword: string | undefined) => {
            if (!currentPassword) return;
            NativeAlert.prompt(
              'Password Baru',
              'Masukkan password baru (min. 8 karakter):',
              [
                { text: 'Batal', style: 'cancel' },
                {
                  text: 'Simpan',
                  onPress: async (newPassword: string | undefined) => {
                    if (!newPassword || newPassword.length < 8) {
                      Alert.alert('Error', 'Password baru minimal 8 karakter.');
                      return;
                    }
                    setSaving(true);
                    try {
                      const response = await api.put('/auth/profile/password', {
                        currentPassword,
                        newPassword,
                      });
                      if (response.data?.success) {
                        Alert.alert('Berhasil', 'Password berhasil diganti. Silakan login ulang.', [
                          {
                            text: 'OK',
                            onPress: async () => {
                              const refreshToken = await AsyncStorage.getItem('refreshToken');
                              await api.post('/auth/logout', { refreshToken }).catch(() => null);
                              dispatch(logout());
                            },
                          },
                        ]);
                      } else {
                        throw new Error(response.data?.error);
                      }
                    } catch (error: any) {
                      Alert.alert('Gagal', error.response?.data?.error || error.message || 'Gagal mengganti password.');
                    } finally {
                      setSaving(false);
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ],
      'secure-text'
    );
  };

  const handleHapusAkun = () => {
    Alert.alert(
      'Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Untuk menghapus akun, silakan hubungi administrator FND Production.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          await api.post('/auth/logout', { refreshToken }).catch(() => null);
          dispatch(logout());
        },
      },
    ]);
  };

  const updatePreference = async (key: 'push_notif' | 'email_notif' | 'dark_mode', value: boolean) => {
    try {
      const response = await api.put('/auth/preferences', { [key]: value });
      if (response.data?.success) {
        dispatch(updateProfileSuccess({ [key]: value }));
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert the local state if the API fails
      if (key === 'push_notif') setNotifPush(!value);
      if (key === 'email_notif') setNotifEmail(!value);
      if (key === 'dark_mode') setDarkMode(!value);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FndHeader title="Pengaturan Akun" dark onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 104, paddingHorizontal: 20 }}
      >
        {/* Info Akun */}
        <View className="mt-5 rounded-2xl border border-slate-100 bg-white p-5" style={{ elevation: 2, shadowColor: '#0D1B5E', shadowOpacity: 0.06, shadowRadius: 10 }}>
          <View className="flex-row items-center mb-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Ionicons name="person-outline" size={20} color="#0D1B5E" />
            </View>
            <View>
              <Text className="font-bold text-primary">{user?.name || 'Crew'}</Text>
              <Text className="text-xs text-slate-400">{user?.email || '-'}</Text>
            </View>
          </View>

          <View className="rounded-xl bg-blue-50 px-4 py-3">
            <Text className="text-xs text-slate-500">
              Role: <Text className="font-bold text-primary capitalize">{user?.role || '-'}</Text>
            </Text>
          </View>
        </View>

        {/* Keamanan */}
        <Text className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Keamanan</Text>
        <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden" style={{ elevation: 2 }}>
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-slate-100"
            onPress={handleGantiPassword}
            disabled={saving}
          >
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <Ionicons name="lock-closed-outline" size={18} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-primary">Ganti Password</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Perbarui kata sandi akun Anda</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-4 py-4" onPress={() => Alert.alert('Info', 'Fitur autentikasi dua faktor akan segera tersedia.')}>
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-green-50">
              <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-primary">Autentikasi Dua Faktor</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Segera tersedia</Text>
            </View>
            <View className="rounded-full bg-slate-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-slate-400">SOON</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifikasi */}
        <Text className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Notifikasi</Text>
        <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden" style={{ elevation: 2 }}>
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100">
            <View className="flex-row items-center flex-1">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="notifications-outline" size={18} color="#0D1B5E" />
              </View>
              <View>
                <Text className="font-semibold text-primary">Push Notification</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Notifikasi tugas & event</Text>
              </View>
            </View>
            <Switch
              value={notifPush}
              onValueChange={(val) => { setNotifPush(val); updatePreference('push_notif', val); }}
              trackColor={{ false: '#E2E8F0', true: '#0D1B5E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center flex-1">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                <Ionicons name="mail-outline" size={18} color="#7C3AED" />
              </View>
              <View>
                <Text className="font-semibold text-primary">Email Notifikasi</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Ringkasan via email</Text>
              </View>
            </View>
            <Switch
              value={notifEmail}
              onValueChange={(val) => { setNotifEmail(val); updatePreference('email_notif', val); }}
              trackColor={{ false: '#E2E8F0', true: '#0D1B5E' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Tampilan */}
        <Text className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Tampilan</Text>
        <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden" style={{ elevation: 2 }}>
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center flex-1">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Ionicons name="moon-outline" size={18} color="#475569" />
              </View>
              <View>
                <Text className="font-semibold text-primary">Mode Gelap</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Tema gelap (segera tersedia)</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(val) => { setDarkMode(val); updatePreference('dark_mode', val); }}
              trackColor={{ false: '#E2E8F0', true: '#0D1B5E' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Tentang Aplikasi */}
        <Text className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Tentang</Text>
        <View className="rounded-2xl border border-slate-100 bg-white overflow-hidden" style={{ elevation: 2 }}>
          <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-primary">Versi Aplikasi</Text>
              <Text className="text-xs text-slate-400 mt-0.5">FND Production v1.0.0</Text>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4"
            onPress={() => Alert.alert('Kebijakan Privasi', 'FND Production menjaga kerahasiaan data Anda. Data hanya digunakan untuk keperluan manajemen event dan tidak disebarkan kepada pihak ketiga.')}
          >
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
              <Ionicons name="document-text-outline" size={18} color="#64748B" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-primary">Kebijakan Privasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Hapus Akun */}
        <TouchableOpacity
          className="mt-6 flex-row items-center rounded-2xl border border-red-100 bg-white px-4 py-4"
          onPress={handleHapusAkun}
        >
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-red-50">
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-red-500">Hapus Akun</Text>
            <Text className="text-xs text-slate-400 mt-0.5">Tindakan permanen, tidak dapat dibatalkan</Text>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          className="mt-3 flex-row items-center rounded-2xl border border-red-100 bg-red-500 px-4 py-4"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text className="ml-3 font-bold text-white">Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
