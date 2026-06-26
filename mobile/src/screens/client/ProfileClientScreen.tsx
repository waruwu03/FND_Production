import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout, updateProfileSuccess } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { initials } from '../../utils/fnd';

const MENU = [
  { label: 'Data Pribadi', icon: 'person-outline', screen: 'EditProfile' },
  { label: 'Ubah Password', icon: 'lock-closed-outline', screen: null },
  { label: 'Pengaturan', icon: 'settings-outline', screen: null },
  { label: 'Bantuan', icon: 'help-circle-outline', screen: null },
];

export const ProfileClientScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isUploading, setIsUploading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const avatarUrl = getAssetUrl(user?.avatar_url);

  useEffect(() => {
    api.get('/events')
      .then((response) => {
        if (response.data?.success) setEvents(response.data.data || []);
      })
      .catch(() => null);
  }, []);

  const completedEvents = useMemo(
    () => events.filter((event) => String(event.status).toLowerCase() === 'selesai').length,
    [events],
  );

  const handleLogout = async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    dispatch(logout());
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin untuk mengakses galeri foto Anda.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setIsUploading(true);
      try {
        const response = await api.post('/auth/profile/avatar-base64', {
          image: result.assets[0].base64,
          mimeType: result.assets[0].mimeType || 'image/jpeg',
        });

        if (response.data?.success) {
          // Fix: dispatch full user data agar tersimpan permanen di Redux + AsyncStorage
          const updatedUser = response.data.data;
          if (updatedUser) {
            dispatch(updateProfileSuccess({
              name: updatedUser.name,
              phone: updatedUser.phone,
              avatar_url: updatedUser.avatar_url,
            }));
          }
          Alert.alert('Berhasil', 'Foto profil berhasil diperbarui.');
        } else {
          throw new Error(response.data?.error || 'Upload gagal');
        }
      } catch {
        Alert.alert('Gagal', 'Terjadi kesalahan saat mengunggah foto profil.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-16 pt-14">
        <View className="h-11 flex-row items-center justify-between">
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full" onPress={() => navigation.getParent()?.navigate('Beranda')}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="font-bold text-white">Profil Saya</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="-mt-14 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104, paddingTop: 48 }}>
        {/* Avatar container outside of the card to prevent clipping */}
        <View style={{ alignItems: 'center', zIndex: 10, marginBottom: -48 }}>
          <TouchableOpacity onPress={pickImage} disabled={isUploading} className="relative">
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
              {avatarUrl ? <Image source={{ uri: avatarUrl }} className="h-full w-full" /> : <Text className="text-xl font-bold text-primary">{initials(user?.name)}</Text>}
              {isUploading ? (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <View className="absolute right-0 bottom-0 h-8 w-8 items-center justify-center rounded-full border border-white bg-primary">
              <Ionicons name="camera" size={15} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating Profile Card */}
        <View className="mx-5 rounded-xl border border-slate-100 bg-white px-5 pb-5 pt-14" style={{ elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
          <Text className="mt-3 text-center text-xl font-black text-primary">{user?.name || 'Client'}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500">{user?.email || '-'}</Text>
          <Text className="mt-1 text-center text-xs text-slate-500">{user?.phone || 'Nomor belum diatur'}</Text>

          <View className="mt-5 flex-row">
            {[
              { value: events.length, label: 'Total Event' },
              { value: completedEvents, label: 'Selesai' },
              { value: '4.9', label: 'Rating Layanan' },
            ].map((item, index) => (
              <View key={item.label} className={`flex-1 items-center rounded-xl bg-orange-50 py-3 ${index < 2 ? 'mr-2' : ''}`}>
                <Text className="text-sm font-black text-primary">{item.value}</Text>
                <Text className="mt-1 text-[10px] text-slate-500">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-5 overflow-hidden rounded-xl border border-slate-100 bg-white">
          {MENU.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => (item.screen ? navigation.navigate(item.screen) : Alert.alert('Info', 'Fitur sedang dalam pengembangan'))}
              className={`flex-row items-center px-4 py-4 ${index < MENU.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <Ionicons name={item.icon as any} size={20} color="#64748B" />
              <Text className="ml-3 flex-1 font-semibold text-primary">{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="mx-5 mt-5 flex-row items-center rounded-xl border border-red-100 bg-white px-4 py-4" onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="ml-3 font-bold text-danger">Keluar Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
