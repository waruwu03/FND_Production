import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

export const ChangePasswordClientScreen = ({ navigation }: any) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Gagal', 'Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Gagal', 'Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data?.success) {
        Alert.alert('Berhasil', 'Password berhasil diubah. Silakan login kembali.', [
          {
            text: 'OK',
            onPress: () => {
              // As the backend revokes the refresh token, ideally we should logout
              // However, just going back for now or letting the interceptor catch 401 is fine
              navigation.goBack();
            }
          }
        ]);
      } else {
        throw new Error(response.data?.error || 'Gagal mengubah password');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.error || error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-5 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Ubah Password</Text>
        </View>
      </View>

      <View className="flex-1 p-5">
        <Text className="mb-2 font-semibold text-slate-700">Password Saat Ini</Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          placeholder="Masukkan password saat ini"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text className="mb-2 font-semibold text-slate-700">Password Baru</Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          placeholder="Minimal 8 karakter"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Text className="mb-2 font-semibold text-slate-700">Konfirmasi Password Baru</Text>
        <TextInput
          className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
          placeholder="Ulangi password baru"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity 
          className="items-center rounded-xl bg-primary py-4"
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-white">Simpan Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
