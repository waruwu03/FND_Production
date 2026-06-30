import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateProfileSuccess } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export const SettingsClientScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.push_notif ?? true);

  const toggleSwitch = async (val: boolean) => {
    setNotificationsEnabled(val);
    try {
      const response = await api.put('/auth/preferences', { push_notif: val });
      if (response.data?.success) {
        dispatch(updateProfileSuccess({ push_notif: val }));
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      setNotificationsEnabled(!val);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun ini secara permanen? Semua data Anda akan hilang dan tidak dapat dikembalikan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/auth/profile');
              if (response.data?.success) {
                Alert.alert('Berhasil', 'Akun Anda telah berhasil dihapus.');
                await AsyncStorage.removeItem('refreshToken');
                dispatch(logout());
              }
            } catch (error: any) {
              Alert.alert('Gagal', error.response?.data?.error || error.message || 'Gagal menghapus akun');
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-5 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Pengaturan</Text>
        </View>
      </View>

      <View className="flex-1 p-5">
        <View className="mb-6 rounded-xl border border-slate-100 bg-white p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="font-semibold text-slate-800">Notifikasi Push</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#F8FAFC'}
              onValueChange={toggleSwitch}
              value={notificationsEnabled}
            />
          </View>
          

        </View>

        <TouchableOpacity 
          className="mt-4 flex-row items-center rounded-xl border border-red-100 bg-red-50 p-4"
          onPress={handleDeleteAccount}
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <View>
            <Text className="font-bold text-red-600">Hapus Akun</Text>
            <Text className="text-xs text-red-400">Tindakan ini permanen</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
