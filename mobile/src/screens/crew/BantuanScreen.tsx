import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FndHeader } from '../../components/FndUi';

const FAQ_ITEMS = [
  {
    question: 'Bagaimana cara check-in di lokasi event?',
    answer: 'Buka menu "Check-In" di bottom navigation, pastikan GPS aktif dan Anda berada di radius 100 meter dari lokasi event. Tekan tombol "Check-In Sekarang" untuk memverifikasi kehadiran.',
  },
  {
    question: 'Bagaimana cara upload dokumentasi event?',
    answer: 'Buka halaman "Dokumentasi" melalui detail tugas atau sidebar menu. Pilih tab "Foto" lalu tekan tombol "Pilih Foto" untuk mengunggah foto dari galeri. Foto maksimal 8MB per file.',
  },
  {
    question: 'Apa yang harus dilakukan jika tidak bisa login?',
    answer: 'Pastikan email dan password benar. Jika lupa password, hubungi admin melalui WhatsApp atau email untuk reset password. Pastikan juga HP dan server berada di jaringan yang sama.',
  },
  {
    question: 'Bagaimana cara update progress pekerjaan?',
    answer: 'Buka detail tugas event, lalu tekan tombol "Update Progress". Pilih status terbaru dari daftar yang tersedia (Persiapan, Setup, Sound Check, Running, dll).',
  },
  {
    question: 'Apakah bisa melihat riwayat tugas sebelumnya?',
    answer: 'Ya, buka menu "Riwayat Tugas" melalui sidebar atau halaman profil. Anda dapat memfilter berdasarkan status Selesai atau Dibatalkan.',
  },
];

export const BantuanScreen = ({ navigation }: any) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  const openWhatsApp = () => {
    const phone = '6281234567890';
    const message = 'Halo Admin FND Production, saya membutuhkan bantuan terkait aplikasi Crew App.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `WhatsApp tidak dapat dibuka. Silakan hubungi: +${phone}`);
    });
  };

  const openEmail = () => {
    const email = 'admin@fndproduction.com';
    const subject = 'Bantuan - FND Production Crew App';
    const body = 'Halo Admin,\n\nSaya membutuhkan bantuan terkait:\n\n[Jelaskan masalah Anda di sini]\n\nTerima kasih.';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {
      Alert.alert('Error', `Tidak dapat membuka aplikasi email. Kirim email ke: ${email}`);
    });
  };



  return (
    <View className="flex-1 bg-background">
      <FndHeader title="Bantuan" dark onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104 }}>
        {/* FAQ */}
        <View className="mx-5 mt-5">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Pertanyaan Umum (FAQ)</Text>

          <View className="overflow-hidden rounded-2xl border border-slate-100 bg-white" style={{ elevation: 2, shadowColor: '#0D1B5E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            {FAQ_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleFAQ(index)}
                className={`px-5 py-4 ${index < FAQ_ITEMS.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="mr-3 flex-1 text-sm font-bold text-primary">{item.question}</Text>
                  <Ionicons name={expanded === index ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                </View>
                {expanded === index && (
                  <Text className="mt-3 text-xs leading-5 text-slate-500">{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hubungi Admin */}
        <View className="mx-5 mt-6">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Hubungi Admin</Text>

          <View className="overflow-hidden rounded-2xl border border-slate-100 bg-white" style={{ elevation: 2, shadowColor: '#0D1B5E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            <TouchableOpacity className="flex-row items-center border-b border-slate-100 px-5 py-4" onPress={openWhatsApp}>
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Ionicons name="logo-whatsapp" size={22} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-primary">WhatsApp</Text>
                <Text className="mt-0.5 text-xs text-slate-400">Chat langsung dengan admin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center px-5 py-4" onPress={openEmail}>
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="mail-outline" size={22} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-primary">Email</Text>
                <Text className="mt-0.5 text-xs text-slate-400">admin@fndproduction.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>


          </View>
        </View>

        {/* Info */}
        <View className="mx-5 mt-5 flex-row rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text className="ml-3 flex-1 text-xs leading-5 text-slate-600">
            Tim support kami siap membantu Anda setiap hari kerja pukul 08.00 - 22.00 WIB. Untuk keperluan darurat saat event, hubungi koordinator lapangan.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
