import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { loginSuccess, User } from '../../store/slices/authSlice';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../services/api';

export const LoginScreen = ({ navigation, route }: any) => {
  const { control, handleSubmit, setValue, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    if (route?.params?.email) {
      setValue('email', route.params.email);
    }
  }, [route?.params?.email]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const payload = response.data?.data || response.data;
      const token = payload?.accessToken || payload?.token;
      const refreshToken = payload?.refreshToken;
      const user = payload?.user;

      if (!token || !refreshToken || !user) {
        throw new Error('Login gagal, coba lagi.');
      }

      const role: User['role'] = user.role === 'crew' ? 'CREW' : user.role === 'admin' ? 'ADMIN' : 'CLIENT';
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      dispatch(loginSuccess({
        user: {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role,
          phone: user.phone || undefined,
          avatar_url: user.avatar_url || undefined,
        },
        token,
        refreshToken,
      }));
    } catch (error: any) {
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) {
        Alert.alert('Koneksi Gagal', 'Tidak dapat terhubung ke server. Pastikan HP dan PC Anda berada di jaringan Wi-Fi yang sama, lalu coba lagi.');
      } else {
        const msg = error.response?.data?.error || error.message || 'Terjadi kesalahan';
        const isInvalidCreds = msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('not found');
        Alert.alert('Login Gagal', isInvalidCreds ? 'Email atau password salah. Silakan coba lagi.' : msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070E1F' }}>
      <StatusBar barStyle="light-content" backgroundColor="#070E1F" />

      {/* Background ambient blobs */}
      <View style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: '#3B82F6', opacity: 0.15, transform: [{ scaleX: 1.2 }] }} />
      <View style={{ position: 'absolute', bottom: -120, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#8B5CF6', opacity: 0.12, transform: [{ scaleY: 1.2 }] }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Logo / Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#3B82F6', letterSpacing: -1.5, textShadowColor: 'rgba(59, 130, 246, 0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}>F</Text>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5, textShadowColor: 'rgba(255, 255, 255, 0.2)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}>ND</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8', marginLeft: 8, letterSpacing: 2.5 }}>PRODUCTION</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>
                Selamat Datang!
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                Masuk untuk mengakses dashboard profesional Anda
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
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
                elevation: 15,
              }}
            >
              <Controller
                control={control}
                rules={{
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid"
                  }
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
                rules={{ required: 'Password wajib diisi' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Masukkan password Anda"
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

              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}>
                <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 13 }}>Lupa Password?</Text>
              </TouchableOpacity>

              <Button
                title="Masuk"
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                disabled={isLoading}
                style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
              />
            </View>

            {/* Sign up link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: '#64748B', fontSize: 14 }}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 14 }}>Daftar Sekarang</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
