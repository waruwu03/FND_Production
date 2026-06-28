import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export const SettingsClientScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const dispatch = useDispatch();

  const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

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
            // Note: Implementing real delete account requires endpoint. Assuming it exists.
            Alert.alert('Info', 'Fitur hapus akun dalam tahap pengembangan backend.');
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-5 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Pengaturan</Text>
        </View>
      </View>

      <View className="flex-1 p-5">
        <View className="mb-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-4">
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
          
          <TouchableOpacity className="flex-row items-center justify-between pt-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="document-text-outline" size={20} color="#64748B" />
              </View>
              <Text className="font-semibold text-slate-800">Syarat & Ketentuan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
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
