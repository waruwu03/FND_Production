import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import { Toast } from '../../components/PremiumToast';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootState } from '../../store';
import { updateProfileSuccess } from '../../store/slices/authSlice';
import { api, getAssetUrl } from '../../services/api';
import { FndHeader } from '../../components/FndUi';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { initials } from '../../utils/fnd';

export const DataPribadiScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const avatarUrl = getAssetUrl(user?.avatar_url);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ title: 'Error', message: 'Nama tidak boleh kosong.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.put('/auth/profile', { name: name.trim(), phone: phone.trim() });
      if (response.data?.success) {
        dispatch(updateProfileSuccess({ name: name.trim(), phone: phone.trim() }));
        Toast.show({ title: 'Berhasil', message: 'Data pribadi berhasil diperbarui.', type: 'success' });
      } else {
        throw new Error(response.data?.error || 'Gagal menyimpan');
      }
    } catch (error: any) {
      Toast.show({ title: 'Error', message: error.response?.data?.error || error.message || 'Gagal menyimpan data.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan akses galeri untuk memilih foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Toast.show({ title: 'Error', message: 'Gagal membaca gambar. Silakan coba lagi.', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    try {
      let mimeType = 'image/jpeg';
      if (asset.mimeType) {
        mimeType = asset.mimeType;
      } else if (asset.uri.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (asset.uri.endsWith('.webp')) {
        mimeType = 'image/webp';
      }

      const base64Data = `data:${mimeType};base64,${asset.base64}`;

      const response = await api.post('/auth/profile/avatar-base64', {
        image: base64Data,
        mimeType,
      });

      if (response.data?.success && response.data?.data) {
        dispatch(updateProfileSuccess(response.data.data));
        Toast.show({ title: 'Berhasil', message: 'Foto profil berhasil diperbarui.', type: 'success' });
      } else {
        throw new Error(response.data?.error || 'Gagal mengupload avatar');
      }
    } catch (error: any) {
      Toast.show({ title: 'Upload Gagal', message: error.response?.data?.error || error.message || 'Gagal mengunggah foto.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FndHeader title="Data Pribadi" dark onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104 }}>
        {/* Avatar */}
        <View className="mt-6 items-center">
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
            {avatarUrl ? (
              <View className="h-28 w-28 rounded-full" style={{ elevation: 4, shadowColor: '#0D1B5E', shadowOpacity: 0.1, shadowRadius: 10 }}>
                <Image source={{ uri: avatarUrl }} className="h-28 w-28 rounded-full border-4 border-white" />
              </View>
            ) : (
              <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-200" style={{ elevation: 4 }}>
                <Text className="text-2xl font-bold text-primary">{initials(user?.name)}</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full bg-primary" style={{ elevation: 3 }}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text className="mt-3 text-xs text-slate-400">Ketuk foto untuk mengganti</Text>
        </View>

        {/* Form */}
        <View className="mt-6">
          <Input
            variant="light"
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={name}
            onChangeText={setName}
            icon="person-outline"
          />

          <View className="mb-4">
            <Text className="mb-2 font-semibold text-[#1E293B]">Email</Text>
            <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <Text className="text-slate-500">{user?.email || '-'}</Text>
            </View>
            <Text className="mt-1 text-xs text-slate-400">Email tidak dapat diubah</Text>
          </View>

          <Input
            variant="light"
            label="Nomor Telepon"
            placeholder="Masukkan nomor telepon"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <View className="mb-4">
            <Text className="mb-2 font-semibold text-[#1E293B]">Role</Text>
            <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <Text className="text-slate-500 capitalize">{user?.role || '-'}</Text>
            </View>
          </View>
        </View>

        <Button
          title="Simpan Perubahan"
          onPress={handleSave}
          isLoading={saving}
          disabled={saving}
          className="mt-2"
        />
      </ScrollView>
    </View>
  );
};
