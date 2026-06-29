import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { logout, updateProfileSuccess } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { initials } from '../../utils/fnd';

const MENU_ITEMS = [
  { label: 'Data Pribadi', icon: 'person-outline', screen: 'DataPribadi' },
  { label: 'Keahlian', desc: 'Sound System, Mixing, Audio Recording', icon: 'construct-outline', screen: 'Keahlian' },
  { label: 'Riwayat Tugas', icon: 'time-outline', screen: 'RiwayatTugas' },
  { label: 'Rekening Pembayaran', icon: 'card-outline', screen: 'Rekening' },
  { label: 'Pengaturan Akun', icon: 'settings-outline', screen: 'PengaturanAkun' },
];

export const ProfileCrewScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  const avatarUrl = getAssetUrl(user?.avatar_url);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    api.get('/events/assigned')
      .then((response) => {
        if (response.data?.success) setTasks(response.data.data || []);
      })
      .catch(() => null);
  }, []);

  const completedCount = useMemo(
    () => tasks.filter((task) => String(task.status).toLowerCase() === 'selesai').length,
    [tasks],
  );

  const handleLogout = async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    dispatch(logout());
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Maaf, kami memerlukan izin galeri foto untuk mengubah avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih gambar.');
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    try {
      let mimeType = 'image/jpeg';
      if (asset.uri.endsWith('.png')) mimeType = 'image/png';
      else if (asset.uri.endsWith('.webp')) mimeType = 'image/webp';

      const base64Data = `data:${mimeType};base64,${asset.base64}`;

      const response = await api.post('/auth/profile/avatar-base64', {
        image: base64Data,
        mimeType,
      });

      if (response.data?.success && response.data?.data) {
        dispatch(updateProfileSuccess(response.data.data));
        Alert.alert('Sukses', 'Avatar berhasil diperbarui!');
      } else {
        throw new Error(response.data?.error || 'Gagal upload avatar');
      }
    } catch (error: any) {
      Alert.alert('Upload Gagal', error.message || 'Terjadi kesalahan saat mengunggah avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top + 8 }} className="bg-[#0A1128] px-5 pb-20">
        <View className="h-11 flex-row items-center justify-between">
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full" onPress={() => navigation.getParent()?.navigate('Beranda')}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="font-bold text-white text-lg">Profil Saya</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="-mt-14 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110, paddingTop: 48 }}>
        {/* Avatar container outside of the card to prevent clipping */}
        <View style={{ alignItems: 'center', zIndex: 10, marginBottom: -48 }}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading} className="relative">
            {avatarUrl ? (
              <Image key={avatarUrl} source={{ uri: avatarUrl }} className="h-24 w-24 rounded-full border-[4px] border-white bg-slate-100 shadow-sm" />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full border-[4px] border-white bg-slate-200">
                <Text className="text-2xl font-bold text-primary">{initials(user?.name)}</Text>
              </View>
            )}
            {isUploading && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border border-white bg-crewAccent">
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating Profile Card */}
        <View className="mx-4 rounded-[24px] border border-slate-100 bg-white px-5 pb-6 pt-14" style={{ elevation: 8, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
          <Text className="mt-3 text-center text-base font-black text-primary">{user?.name || 'Andi Setiawan'}</Text>
          <View className="mt-1 flex-row items-center justify-center gap-1.5">
            <Ionicons name="mic-outline" size={13} color="#64748B" />
            <Text className="text-[11px] font-semibold text-slate-500">Sound Engineer</Text>
          </View>
          
          <View className="my-3 h-px bg-slate-50" />

          {/* Performance Analytics Grid */}
          <Text className="text-[10px] font-black text-slate-400 mb-2.5 text-left" style={{ textAlign: 'left' }}>PERFORMANCE ANALYTICS</Text>
          <View className="flex-row gap-2.5">
            {[
              { value: '3 Tahun', label: 'Pengalaman', emoji: '🏆' },
              { value: '4.8', label: 'Rating', emoji: '⭐' },
              { value: `${completedCount} Event`, label: 'Tugas Selesai', emoji: '✅' },
            ].map((item, index) => (
              <View key={item.label} className="flex-1 items-center rounded-xl bg-crewBg py-2.5 border border-slate-100">
                <Text className="text-sm mb-1">{item.emoji}</Text>
                <Text className="text-xs font-black text-primary">{item.value}</Text>
                <Text className="text-[8px] text-slate-400 mt-0.5">{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Skill Tags Section */}
          <Text className="mt-5 text-[10px] font-black text-slate-400 mb-2 text-left" style={{ textAlign: 'left' }}>SKILL TAGS</Text>
          <View className="flex-row flex-wrap gap-2 justify-start">
            <View className="bg-crewAccent/10 border border-crewAccent/20 rounded-full px-3 py-1">
              <Text className="text-[9px] font-bold text-crewAccent">🎛️ Sound Tech</Text>
            </View>
            <View className="bg-crewAccent/10 border border-crewAccent/20 rounded-full px-3 py-1">
              <Text className="text-[9px] font-bold text-crewAccent">🎚️ Mixing</Text>
            </View>
            <View className="bg-crewAccent/10 border border-crewAccent/20 rounded-full px-3 py-1">
              <Text className="text-[9px] font-bold text-crewAccent">🎙️ Audio Recording</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-4 mt-5 overflow-hidden rounded-[24px] border border-slate-100 bg-white" style={{ elevation: 1 }}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              className={`flex-row items-center px-4 py-3.5 ${index < MENU_ITEMS.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-crewBg border border-slate-100">
                <Ionicons name={item.icon as any} size={18} color="#0F172A" />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-xs font-bold text-primary">{item.label}</Text>
                {item.desc ? <Text className="mt-0.5 text-[10px] text-slate-400" numberOfLines={1}>{item.desc}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Option */}
        <TouchableOpacity 
          className="mx-4 mt-5 flex-row items-center px-4 py-3.5 rounded-[24px] bg-red-500/10 border border-red-500/15" 
          onPress={handleLogout}
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-100">
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <Text className="ml-3.5 font-bold text-red-500 text-xs">Keluar</Text>
          <Ionicons name="chevron-forward" size={16} color="#EF4444" className="ml-auto" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
