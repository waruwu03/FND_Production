import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getAssetUrl } from '../../services/api';
import { InfoRow, LoadingState, StatusBadge } from '../../components/FndUi';
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
          Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal memuat detail tugas');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (loading) return <LoadingState dark />;

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
      Alert.alert('Kontak belum tersedia', 'Nomor PIC/client belum tersedia di database.');
      return;
    }
    Linking.openURL(`tel:${clientPhone}`).catch(() => Alert.alert('Gagal', 'Tidak dapat membuka telepon.'));
  };

  const updateEventStatus = async (newStatus: string) => {
    try {
      const res = await api.put(`/events/${eventId}/status`, { status: newStatus });
      if (res.data?.success) {
        Alert.alert('Sukses', 'Status tugas berhasil diperbarui.');
        setEvent((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal mengubah status');
    }
  };

  return (
    <View className="flex-1 bg-primary">
      {/* Hero Cover Image Header */}
      <View className="relative h-64">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full bg-slate-800" resizeMode="cover" />
        ) : (
          <View className="h-full w-full bg-slate-800" />
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
          <View className="flex-row items-center justify-between px-3 py-2.5 bg-black/55 rounded-2xl">
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
      <View className="-mt-4 flex-1 rounded-t-[24px] bg-white">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 }}>
          <Text className="mb-4 text-xl font-black text-primary">{data.name || 'Detail Tugas'}</Text>

          <InfoRow icon="location-outline" title={location.venue} subtitle={location.address} />
          <InfoRow icon="time-outline" title={formatLongDate(data.event_date)} subtitle="08.00 - Selesai" />

          {/* Action buttons side-by-side */}
          <View className="flex-row gap-2.5 my-3">
            <TouchableOpacity onPress={callClient} className="flex-1 flex-row items-center justify-center bg-primary py-3 rounded-xl shadow-sm">
              <Ionicons name="call-outline" size={14} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold text-white">Contact Client</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CheckIn')} className="flex-1 flex-row items-center justify-center bg-slate-50 border border-slate-200 py-3 rounded-xl">
              <Ionicons name="location-outline" size={14} color="#0F172A" />
              <Text className="ml-2 text-xs font-bold text-primary">Location Card</Text>
            </TouchableOpacity>
          </View>

          <View className="my-2 h-px bg-slate-100" />

          <View className="py-2.5">
            <Text className="text-xs font-black text-primary mb-1">Posisi</Text>
            <Text className="text-xs text-slate-500">{data.task || 'Support Crew'}</Text>
          </View>

          <View className="h-px bg-slate-100" />

          {/* Checklist Area with custom checkboxes */}
          <Text className="mb-3 mt-4 text-sm font-black text-primary">Task Checklist</Text>
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
                <View key={step.label} className="flex-row items-center justify-between py-2.5 border-b border-slate-50">
                  <View className="flex-row items-center flex-1 mr-4">
                    <View className={`h-5 w-5 rounded-[6px] items-center justify-center mr-3 ${done ? 'bg-emerald-500' : 'border border-slate-300'}`}>
                      {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                    </View>
                    <Text className={`text-xs ${done ? 'line-through text-slate-400' : 'font-semibold text-primary'}`}>
                      {step.label}
                    </Text>
                  </View>
                  <StatusBadge label={badgeLabel} bg={badgeColor} text={badgeText} />
                </View>
              );
            })}
          </View>

          <View className="h-px bg-slate-100" />

          {/* Contact client preview card */}
          <View className="py-4">
            <Text className="mb-2 text-xs font-black text-primary">PIC / Client</Text>
            <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
              <View>
                <Text className="text-xs font-bold text-primary">{data.client_name || 'PT Maju Bersama'}</Text>
                <Text className="text-[10px] text-slate-400">{clientPhone || '0812-xxxx-xxxx'}</Text>
              </View>
              <TouchableOpacity onPress={callClient} className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Ionicons name="call" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Embedded Contact Button Widget */}
          <TouchableOpacity onPress={callClient} className="flex-row items-center bg-orange-50 border border-orange-200 rounded-xl p-3.5 mt-2">
            <Ionicons name="call-outline" size={16} color="#F97316" />
            <Text className="ml-3 text-xs font-bold text-crewAccent">Contact Client Button</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky Update Progress CTA */}
        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-5 pb-7 pt-4 flex-row justify-between gap-3">
          <TouchableOpacity 
            className="flex-1 items-center rounded-xl bg-slate-100 py-3.5" 
            onPress={openDocumentation}
          >
            <Text className="text-xs font-bold text-slate-600">Dokumentasi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center rounded-xl bg-crewAccent py-3.5 shadow-md shadow-crewAccent/25" 
            onPress={() => {
              if (data.status === 'selesai') {
                 Alert.alert('Info', 'Tugas ini sudah selesai.');
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
