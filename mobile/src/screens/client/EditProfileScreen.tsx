import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { updateProfileSuccess } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../services/api';

export const EditProfileScreen = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        name: data.name,
        phone: data.phone,
      });

      if (response.data.success) {
        dispatch(updateProfileSuccess({ name: data.name, phone: data.phone }));
        Alert.alert('Berhasil', 'Data profil berhasil diperbarui.');
        navigation.goBack();
      } else {
        Alert.alert('Gagal', response.data.error || 'Terjadi kesalahan saat menyimpan profil.');
      }
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 40 }}>
        <Text className="text-[#0F172A] font-bold text-2xl mb-6">Edit Data Pribadi</Text>

        <Controller
          control={control}
          rules={{ required: 'Nama lengkap wajib diisi' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              variant="light"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message as string}
              icon="person-outline"
            />
          )}
          name="name"
        />

        <Controller
          control={control}
          rules={{ required: 'Nomor HP wajib diisi' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              variant="light"
              label="Nomor HP"
              placeholder="Masukkan nomor handphone"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="phone-pad"
              error={errors.phone?.message as string}
              icon="call-outline"
            />
          )}
          name="phone"
        />

        <View className="mb-4">
          <Input
            variant="light"
            label="Email"
            value={user?.email}
            editable={false}
            icon="mail-outline"
          />
          <Text className="text-xs text-gray-400 mt-1">Email digunakan untuk login dan tidak dapat diubah.</Text>
        </View>

        <Button 
          title="Simpan Perubahan" 
          onPress={handleSubmit(onSubmit)} 
          isLoading={isLoading}
          disabled={isLoading}
          className="mt-6 shadow-sm"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
