import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import { Toast } from '../../components/PremiumToast';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getAssetUrl } from '../../services/api';
import { InfoRow, LoadingState, StatusBadge, DetailHeroSkeleton } from '../../components/FndUi';
import { formatLongDate, getEventImage, getEventStatusMeta, getLocationParts } from '../../utils/fnd';

const TIMELINE = [
  { label: 'Persiapan', time: '08.00' },
  { label: 'Setup Alat', time: '09.00' },
  { label: 'Sound Check', time: '11.00' },
  { label: 'Event Berlangsung', time: '13.00' },
  { label: 'Pembongkaran', time: 'Selesai Event' },
];

export const DetailTugasScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<any>(route?.params?.event || null);
  const [loading, setLoading] = useState(Boolean(route?.params?.taskId && !route?.params?.event));
  const eventId = route?.params?.taskId || route?.params?.event?.id;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await api.get(`/events/${eventId}`);
        if (response.data?.success) {
          setEvent({ ...(route?.params?.event || {}), ...response.data.data });
        }
      } catch (error: any) {
        if (!event) {
          Toast.show({ title: 'Gagal Memuat', message: error.response?.data?.error || error.message || 'Gagal memuat detail tugas', type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (loading) return <DetailHeroSkeleton />;

  const data = event || {};
  const status = getEventStatusMeta(data.status);
  const location = getLocationParts(data);
  const imageUrl = getAssetUrl(getEventImage(data)) || getEventImage(data);
  const clientPhone = data.client_phone || data.phone;

  const openDocumentation = () => {
    const routeNames = navigation.getState?.().routeNames || [];
    if (routeNames.includes('Dokumentasi')) {
      navigation.navigate('Dokumentasi', { event: data });
      return;
    }
    navigation.getParent()?.navigate('Tugas', { screen: 'Dokumentasi', params: { event: data } });
  };

  const callClient = () => {
    if (!clientPhone) {
      Toast.show({ title: 'Kontak belum tersedia', message: 'Nomor PIC/client belum tersedia di database.', type: 'info' });
      return;
    }
    Linking.openURL(`tel:${clientPhone}`).catch(() => Toast.show({ title: 'Gagal', message: 'Tidak dapat membuka telepon.', type: 'error' }));
  };

  const updateEventStatus = async (newStatus: string) => {
    try {
      const res = await api.put(`/events/${eventId}/status`, { status: newStatus });
      if (res.data?.success) {
        Toast.show({ title: 'Sukses', message: 'Status tugas berhasil diperbarui.', type: 'success' });
        setEvent((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      Toast.show({ title: 'Gagal', message: err.response?.data?.error || 'Gagal mengubah status', type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-primary dark:bg-slate-950">
      {/* Hero Cover Image Header */}
      <View className="relative h-64">
        {imageUrl ? (
          // @ts-ignore - Reanimated 3 types sometimes miss sharedTransitionTag
          <Animated.Image 
            {...({ sharedTransitionTag: `event-hero-${data?.id || eventId}` } as any)}
            source={{ uri: imageUrl }} 
            className="h-full w-full bg-slate-800" 
            resizeMode="cover" 
          />
        ) : (
          <Animated.View {...({ sharedTransitionTag: `event-hero-${data?.id || eventId}` } as any)} className="h-full w-full bg-slate-800" />
        )}
        <View className="absolute inset-0 bg-black/40" />
        
        {/* Floating header details */}
        <View style={{ top: insets.top + 8 }} className="absolute left-4 right-4 flex-row items-center justify-between z-10">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-9 w-9 items-center justify-center rounded-full bg-black/40">
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="font-extrabold text-white text-xs">Hero Banner Event</Text>
          <StatusBadge label={status.label} bg="bg-emerald-500" text="text-white" />
        </View>

        {/* Horizontal timeline progress nodes on top of cover image bottom */}
        <View className="absolute bottom-6 left-4 right-4">
          <View className="flex-row items-center justify-between px-3 py-2.5 bg-black/55 dark:bg-black/75 rounded-2xl">
            {/* Step 1: Persiapan */}
            <View className="items-center">
              <View className="h-6 w-6 rounded-full bg-emerald-500 items-center justify-center">
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text className="text-[8px] font-bold text-white mt-1">Persiapan</Text>
            </View>
            <View className="flex-1 h-[2px] bg-emerald-500 mx-1" />

            {/* Step 2: Timeline */}
            <View className="items-center">
              <View className="h-6 w-6 rounded-full bg-emerald-500 items-center justify-center">
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text className="text-[8px] font-bold text-white mt-1">Timeline</Text>
            </View>
            <View className="flex-1 h-[2px] bg-emerald-500 mx-1" />

            {/* Step 3: Progress */}
            <View className="items-center">
              <View className="h-6 w-6 rounded-full bg-crewAccent items-center justify-center">
                <Text className="text-[9px] font-bold text-white">3</Text>
              </View>
              <Text className="text-[8px] font-bold text-white mt-1">Progress</Text>
            </View>
            <View className="flex-1 h-[2px] bg-slate-500 mx-1" />

            {/* Step 4: Selesai */}
            <View className="items-center">
              <View className="h-6 w-6 rounded-full bg-slate-700 items-center justify-center border border-slate-500">
                <Text className="text-[9px] font-bold text-slate-400">4</Text>
              </View>
              <Text className="text-[8px] font-bold text-slate-400 mt-1">Selesai</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Detail Content Sheet */}
      <View className="-mt-4 flex-1 rounded-t-[24px] bg-white dark:bg-slate-900">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 }}>
          <Text className="mb-4 text-xl font-black text-primary dark:text-slate-100">{data.name || 'Detail Tugas'}</Text>

          <InfoRow icon="location-outline" title={location.venue} subtitle={location.address} />
          <InfoRow icon="time-outline" title={formatLongDate(data.event_date)} subtitle="08.00 - Selesai" />

          {/* Action buttons side-by-side */}
          <View className="flex-row gap-2.5 my-3">
            <TouchableOpacity onPress={callClient} className="flex-1 flex-row items-center justify-center bg-primary dark:bg-slate-800 py-3 rounded-xl shadow-sm">
              <Ionicons name="call-outline" size={14} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold text-white">Contact Client</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CheckIn')} className="flex-1 flex-row items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl">
              <Ionicons name="location-outline" size={14} color="#0F172A" style={{ color: '#0F172A' }} />
              <Text className="ml-2 text-xs font-bold text-primary dark:text-slate-100">Location Card</Text>
            </TouchableOpacity>
          </View>

          <View className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

          <View className="py-2.5">
            <Text className="text-xs font-black text-primary dark:text-slate-100 mb-1">Posisi</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">{data.task || 'Support Crew'}</Text>
          </View>

          <View className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Checklist Area with custom checkboxes */}
          <Text className="mb-3 mt-4 text-sm font-black text-primary dark:text-slate-100">Task Checklist</Text>
          <View className="mb-4">
            {TIMELINE.map((step, index) => {
              const done = index < status.step || data.status === 'selesai';
              const current = index === status.step && data.status !== 'selesai';
              
              // Map visual status badge based on step
              let badgeColor = 'bg-slate-100';
              let badgeText = 'text-slate-500';
              let badgeLabel = 'Selesai';
              
              if (step.label === 'Persiapan') {
                badgeColor = 'bg-emerald-50';
                badgeText = 'text-emerald-600';
                badgeLabel = 'Persiapan';
              } else if (step.label === 'Setup Alat') {
                badgeColor = 'bg-blue-50';
                badgeText = 'text-blue-600';
                badgeLabel = 'Setup Alat';
              } else if (step.label === 'Sound Check') {
                badgeColor = 'bg-emerald-50';
                badgeText = 'text-emerald-600';
                badgeLabel = 'Selesai';
              } else if (step.label === 'Event Berlangsung') {
                badgeColor = 'bg-orange-50';
                badgeText = 'text-orange-600';
                badgeLabel = 'Berlangsung';
              } else if (step.label === 'Pembongkaran') {
                badgeColor = 'bg-slate-50';
                badgeText = 'text-slate-600';
                badgeLabel = 'Selesai';
              }

              return (
                <View key={step.label} className="flex-row items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/50">
                  <View className="flex-row items-center flex-1 mr-4">
                    <View className={`h-5 w-5 rounded-[6px] items-center justify-center mr-3 ${done ? 'bg-emerald-500' : 'border border-slate-300 dark:border-slate-600'}`}>
                      {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                    </View>
                    <Text className={`text-xs ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'font-semibold text-primary dark:text-slate-100'}`}>
                      {step.label}
                    </Text>
                  </View>
                  <StatusBadge label={badgeLabel} bg={badgeColor} text={badgeText} />
                </View>
              );
            })}
          </View>

          <View className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Contact client preview card */}
          <View className="py-4">
            <Text className="mb-2 text-xs font-black text-primary dark:text-slate-100">PIC / Client</Text>
            <View className="flex-row items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
              <View>
                <Text className="text-xs font-bold text-primary dark:text-slate-100">{data.client_name || 'PT Maju Bersama'}</Text>
                <Text className="text-[10px] text-slate-400 dark:text-slate-500">{clientPhone || '0812-xxxx-xxxx'}</Text>
              </View>
              <TouchableOpacity onPress={callClient} className="h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-slate-700">
                <Ionicons name="call" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Embedded Contact Button Widget */}
          <TouchableOpacity onPress={callClient} className="flex-row items-center bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-xl p-3.5 mt-2">
            <Ionicons name="call-outline" size={16} color="#F97316" />
            <Text className="ml-3 text-xs font-bold text-crewAccent dark:text-orange-400">Contact Client Button</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky Update Progress CTA */}
        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pb-7 pt-4 flex-row justify-between gap-3">
          <TouchableOpacity 
            className="flex-1 items-center rounded-xl bg-slate-100 dark:bg-slate-800 py-3.5" 
            onPress={openDocumentation}
          >
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">Dokumentasi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center rounded-xl bg-crewAccent py-3.5 shadow-md shadow-crewAccent/25" 
            onPress={() => {
              if (data.status === 'selesai') {
                 Toast.show({ title: 'Info', message: 'Tugas ini sudah selesai.', type: 'info' });
                 return;
              }
              const nextStatus = data.status === 'running' ? 'selesai' : 'running';
              const nextLabel = data.status === 'running' ? 'Selesaikan Tugas' : 'Mulai Event';
              Alert.alert(
                'Update Status', 
                `Ubah status tugas menjadi "${nextLabel}"?`,
                [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Ya, Ubah', onPress: () => updateEventStatus(nextStatus) }
                ]
              );
            }}
          >
            <Text className="text-xs font-bold text-white">
               {data.status === 'selesai' ? 'Tugas Selesai' : (data.status === 'running' ? 'Selesaikan Tugas' : 'Mulai Event')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
