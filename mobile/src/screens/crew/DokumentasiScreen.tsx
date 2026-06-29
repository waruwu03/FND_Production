import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import { Toast } from '../../components/PremiumToast';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api, getAssetUrl, uploadFormData } from '../../services/api';
import { EmptyState, FndHeader } from '../../components/FndUi';
import { eventImages } from '../../utils/fnd';

const TABS = ['Foto', 'Video'];

function parseImages(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.startsWith('http') ? [value] : [];
    }
  }
  return [];
}

export const DokumentasiScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Foto');
  const [event, setEvent] = useState<any>(route?.params?.event || null);
  const [loading, setLoading] = useState(!route?.params?.event);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        if (event?.id) {
          const detail = await api.get(`/events/${event.id}`);
          if (detail.data?.success) setEvent({ ...event, ...detail.data.data });
          return;
        }

        const response = await api.get('/events/assigned');
        const assigned = response.data?.data || [];
        const current = assigned.find((item: any) => !['selesai', 'cancel'].includes(String(item.status).toLowerCase())) || assigned[0];
        if (current?.id) {
          const detail = await api.get(`/events/${current.id}`);
          setEvent(detail.data?.data || current);
        }
      } catch {
        setEvent(route?.params?.event || null);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [event?.id]);

  const photos = useMemo(() => {
    const docs = parseImages(event?.reference_images).map((url) => getAssetUrl(url) || url);
    return docs.length ? docs : eventImages.slice(0, 9);
  }, [event?.reference_images]);

  const uploadPhoto = async () => {
    if (!event?.id) {
      Toast.show({ title: 'Belum ada event', message: 'Pilih event tugas terlebih dahulu untuk mengunggah dokumentasi.', type: 'info' });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan akses galeri untuk memilih foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: 6,
    });

    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const formData = new FormData();

      for (let index = 0; index < result.assets.length; index++) {
        const asset = result.assets[index];
        let ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
        // Safe extension fallback check
        if (ext.length > 5 || !/^[a-z0-9]+$/.test(ext)) {
          ext = 'jpg';
        }
        
        let mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
        // Normalize HEIC/HEIF to jpeg
        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          mimeType = 'image/jpeg';
        }
        
        const fileName = asset.fileName || `documentation-${Date.now()}-${index}.${ext}`;

        if (Platform.OS === 'web') {
          // Di Expo Web, uri adalah blob:// URL — harus di-fetch dulu jadi File object
          const fetchResp = await fetch(asset.uri);
          const blob = await fetchResp.blob();
          const file = new File([blob], fileName, { type: mimeType });
          formData.append('images', file);
        } else {
          // Di React Native (Android/iOS)
          formData.append('images', { uri: asset.uri, name: fileName, type: mimeType } as any);
        }
      }

      // Gunakan native fetch (bukan axios) agar Content-Type boundary diisi otomatis
      await uploadFormData(`/events/${event.id}/documentation`, formData);

      const detail = await api.get(`/events/${event.id}`);
      if (detail.data?.success) setEvent(detail.data.data);
      Toast.show({ title: 'Berhasil! 🎉', message: `${result.assets.length} foto berhasil diunggah ke dokumentasi event.`, type: 'success' });
    } catch (error: any) {
      console.error('Upload error detail:', error);
      const errMsg = error?.message || JSON.stringify(error) || 'Terjadi kesalahan saat upload';
      Toast.show({ title: 'Upload Gagal', message: errMsg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-crewBg">
      {/* Header bar */}
      <View style={{ paddingTop: insets.top + 10 }} className="bg-primary px-5 pb-4">
        <View className="h-11 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-base font-extrabold text-white">Dokumentasi Event</Text>
          <View className="w-9" />
        </View>
      </View>

      {/* Segmented Top Tabs (Orange active highlight) */}
      <View className="flex-row bg-white border-b border-slate-100">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-3.5 relative"
            >
              <Text className={`text-xs font-bold ${isActive ? 'text-crewAccent' : 'text-slate-400'}`}>
                {tab}
              </Text>
              {isActive ? (
                <View className="absolute bottom-0 left-[35%] right-[35%] h-[2px] bg-crewAccent rounded-full" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mini Search Bar & Filter Buttons */}
      <View className="flex-row items-center gap-2 px-4 py-3 bg-white border-b border-slate-100">
        <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Ionicons name="search-outline" size={14} color="#94A3B8" />
          <Text className="ml-2 text-slate-400 text-xs font-medium">Search documentation...</Text>
        </View>
        <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
          <Ionicons name="funnel-outline" size={15} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
          <Ionicons name="grid-outline" size={15} color="#475569" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 }}>
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-xs font-black text-primary">
              {activeTab === 'Foto' ? 'Foto Terakhir' : 'Video Terakhir'}
            </Text>
            <Text className="text-[10px] font-extrabold text-crewAccent">Grid view</Text>
          </View>

          {activeTab === 'Video' ? (
            <EmptyState icon="videocam-outline" title="Belum ada video" description="Backend saat ini menerima dokumentasi foto. Video dapat ditambahkan setelah endpoint media video tersedia." />
          ) : (
            <View className="flex-row flex-wrap justify-start gap-2.5">
              {photos.map((uri, index) => (
                <TouchableOpacity 
                  key={`${uri}-${index}`} 
                  className="mb-1 overflow-hidden rounded-xl bg-slate-100 border border-slate-100" 
                  style={{ width: '30.8%', aspectRatio: 1 }}
                >
                  <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text className="mb-3.5 mt-6 text-xs font-black text-primary">Upload Dokumentasi</Text>
          
          {/* Dashed orange border upload button card */}
          <TouchableOpacity
            onPress={uploadPhoto}
            disabled={uploading || activeTab !== 'Foto'}
            className="flex-col items-center justify-center rounded-2xl bg-orange-50/20 py-7 px-4"
            style={{
              borderStyle: 'dashed',
              borderWidth: 1.5,
              borderColor: '#F97316',
            }}
          >
            {uploading ? (
              <ActivityIndicator color="#F97316" size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={28} color="#F97316" />
            )}
            <Text className="mt-2.5 text-xs font-extrabold text-crewAccent">
              {uploading ? 'Mengunggah...' : 'Tambah Foto Baru'}
            </Text>
            <Text className="mt-1 text-[9px] text-slate-400">Maks. 8MB / foto</Text>
          </TouchableOpacity>

          <View className="mt-5 flex-row rounded-2xl border border-blue-50 bg-blue-50/40 p-4">
            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
            <Text className="ml-3 flex-1 text-[10px] leading-4 text-slate-500">
              Foto dokumentasi yang Anda unggah akan disimpan ke server dan disinkronisasikan ke dasbor admin FND Production.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};
