import React, { useState, useRef, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, Animated, StatusBar } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../services/api';

export const RegisterScreen = ({ navigation }: any) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const password = watch('password');

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.data?.success) {
        Alert.alert('Berhasil', 'Akun client berhasil dibuat. Silakan login.');
        navigation.navigate('Login', { email: data.email });
      } else {
        throw new Error(response.data?.error || 'Registrasi gagal');
      }
    } catch (error: any) {
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) {
        Alert.alert(
          'Koneksi Gagal',
          'Tidak dapat terhubung ke server. Pastikan HP dan PC Anda berada di jaringan Wi-Fi yang sama, lalu coba lagi.'
        );
      } else {
        const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan';
        const isEmailTaken = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered');
        Alert.alert(
          isEmailTaken ? 'Email Sudah Terdaftar' : 'Registrasi Gagal',
          isEmailTaken ? 'Email ini sudah digunakan. Gunakan email lain atau langsung login.' : msg
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070E1F' }}>
      <StatusBar barStyle="light-content" backgroundColor="#070E1F" />

      {/* Background ambient blobs */}
      <View style={{ position: 'absolute', top: -120, left: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: '#8B5CF6', opacity: 0.15, transform: [{ scaleX: 1.2 }] }} />
      <View style={{ position: 'absolute', bottom: 60, right: -120, width: 300, height: 300, borderRadius: 150, backgroundColor: '#3B82F6', opacity: 0.12, transform: [{ scaleY: 1.2 }] }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 28,
                alignSelf: 'flex-start',
                gap: 6,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>Kembali</Text>
            </TouchableOpacity>

            {/* Logo / Header */}
            <View style={{ alignItems: 'center', marginBottom: 36 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#3B82F6', letterSpacing: -1.5, textShadowColor: 'rgba(59, 130, 246, 0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}>F</Text>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5, textShadowColor: 'rgba(255, 255, 255, 0.2)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}>ND</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', marginLeft: 8, letterSpacing: 2.5 }}>PRODUCTION</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>
                Buat Akun Baru
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                Daftar sebagai Client FND Production
              </Text>
            </View>

            {/* Form Card */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                padding: 28,
                marginBottom: 24,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
                elevation: 15,
              }}
            >
               <Controller
                control={control}
                rules={{ required: 'Nama lengkap wajib diisi' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
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
                rules={{
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Format email tidak valid',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Masukkan email Anda"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message as string}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    icon="mail-outline"
                  />
                )}
                name="email"
              />

              <Controller
                control={control}
                rules={{ required: 'Password wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Buat password (min. 8 karakter)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message as string}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    icon="lock-closed-outline"
                  />
                )}
                name="password"
              />

              <Controller
                control={control}
                rules={{
                  required: 'Konfirmasi password wajib diisi',
                  validate: value => value === password || 'Password tidak cocok',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Konfirmasi Password"
                    placeholder="Ulangi password Anda"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message as string}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    icon="lock-closed-outline"
                  />
                )}
                name="confirmPassword"
              />

              <Button
                title="Daftar Sekarang"
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                disabled={isLoading}
                className="mt-2"
                style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
              />
            </View>

            {/* Login link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 }}>
              <Text style={{ color: '#64748B', fontSize: 14 }}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 14 }}>Masuk</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
