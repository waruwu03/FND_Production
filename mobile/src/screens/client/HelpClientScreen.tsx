import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
  {
    q: 'Bagaimana cara melakukan penyewaan?',
    a: 'Anda bisa melakukan penyewaan dengan menekan tombol "Sewa Sekarang" di halaman Beranda, lalu memilih alat-alat yang ingin disewa, serta menentukan tanggal acara.'
  },
  {
    q: 'Berapa lama proses persetujuan pesanan?',
    a: 'Admin kami akan mereview pesanan Anda dalam 1x24 jam. Jika disetujui, Anda akan mendapatkan invoice tagihan.'
  },
  {
    q: 'Bagaimana sistem pembayarannya?',
    a: 'Anda dapat membayar dengan cara transfer bank setelah pesanan disetujui, lalu mengunggah bukti pembayarannya di menu Event Saya.'
  }
];

export const HelpClientScreen = ({ navigation }: any) => {

  const handleWhatsApp = () => {
    // Ganti dengan nomor WhatsApp Admin yang sebenarnya
    const adminPhone = '6281234567890';
    const text = 'Halo Admin FND Production, saya butuh bantuan terkait aplikasi.';
    Linking.openURL(`whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(text)}`)
      .catch(() => {
        // Fallback jika WA tidak terinstall
        Linking.openURL(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`);
      });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-5 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Bantuan</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5">
        <Text className="mb-4 text-lg font-bold text-slate-800">Frequently Asked Questions (FAQ)</Text>
        
        {FAQS.map((faq, idx) => (
          <View key={idx} className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Text className="mb-2 font-bold text-primary">{faq.q}</Text>
            <Text className="text-sm leading-5 text-slate-600">{faq.a}</Text>
          </View>
        ))}

        <Text className="mb-4 mt-6 text-lg font-bold text-slate-800">Hubungi Customer Service</Text>
        <TouchableOpacity 
          className="flex-row items-center justify-center rounded-xl bg-green-500 py-4 shadow-sm"
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          <Text className="ml-3 font-bold text-white">Chat via WhatsApp</Text>
        </TouchableOpacity>
        
        <View className="h-10" />
      </ScrollView>
    </View>
  );
};
