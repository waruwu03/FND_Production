import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, ProgressBar, StatusBadge } from '../../components/FndUi';
import { formatDate, getEventImage, getEventStatusMeta, getLocationParts, initials } from '../../utils/fnd';

const QUICK_MENU = [
  { label: 'Booking Event', icon: 'calendar-outline', screen: 'Booking' },
  { label: 'Layanan', icon: 'construct-outline', screen: 'Layanan' },
  { label: 'Galeri', icon: 'image-outline', screen: 'Layanan' },
  { label: 'Promo', icon: 'pricetag-outline', screen: 'Promo' },
];

export const ClientDashboardScreen = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const avatarUrl = getAssetUrl(user?.avatar_url);

  const fetchEvents = async () => {
    const response = await api.get('/events');
    if (response.data?.success) setEvents(response.data.data || []);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents().catch(() => null);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents().catch(() => null);
    setRefreshing(false);
  };

  const latestEvent = events.find((event) => !['selesai', 'cancel'].includes(String(event.status).toLowerCase())) || events[0];
  const latestStatus = latestEvent ? getEventStatusMeta(latestEvent.status) : null;
  const latestLocation = latestEvent ? getLocationParts(latestEvent) : null;

  const goTo = (screen: string) => {
    if (screen === 'Layanan' || screen === 'Promo') {
      navigation.navigate('Layanan');
      return;
    }
    navigation.getParent()?.navigate(screen);
  };

  return (
    <View className="flex-1 bg-primary">
      {/* Header section with Dark Navy background - sama seperti Crew App */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-5 pb-7">
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-xs font-black tracking-widest text-white">FND PRODUCTION</Text>
            <Text className="text-[8px] font-semibold tracking-widest text-slate-400">CLIENT APP</Text>
          </View>
          <TouchableOpacity className="relative h-9 w-9 items-center justify-center rounded-full bg-white/10" onPress={() => navigation.navigate('Notifikasi')}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-danger">
              <Text className="text-[8px] font-bold text-white">3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-11 w-11 rounded-full border border-white/20 bg-slate-800" />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <Text className="font-bold text-white text-xs">{initials(user?.name)}</Text>
            </View>
          )}
          <View className="ml-3.5 flex-1">
            <Text className="text-base font-extrabold text-white" numberOfLines={1}>Halo, {user?.name || 'Client'}</Text>
            <Text className="text-[10px] text-slate-400">{user?.email || 'client@fnd.com'}</Text>
          </View>
        </View>
      </View>

      {/* Main body with light off-white background - sama seperti Crew App */}
      <View className="-mt-4 flex-1 rounded-t-[24px] bg-crewBg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 }}
      >
        <View className="mb-5 overflow-hidden rounded-[24px] border border-slate-100 bg-primary" style={{ elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80' }} className="absolute h-full w-full opacity-55" resizeMode="cover" />
          <View className="min-h-[150px] justify-between p-5">
            <View>
              <Text className="text-xl font-black text-white">WEDDING PACKAGE</Text>
              <Text className="mt-2 text-xs leading-5 text-white/90">Make Your Special Day{"\n"}More Perfect</Text>
            </View>
            <TouchableOpacity className="self-start rounded-md bg-white px-4 py-2" onPress={() => goTo('Booking')}>
              <Text className="text-xs font-black text-primary">Lihat Paket</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-5 flex-row justify-center">
          {[0, 1, 2, 3, 4].map((item) => (
            <View key={item} className={`mx-1 h-1.5 rounded-full ${item === 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </View>

        <View className="mb-5 flex-row justify-between">
          {QUICK_MENU.map((item) => (
            <TouchableOpacity key={item.label} className="items-center" onPress={() => goTo(item.screen)}>
              <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-white" style={{ elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Ionicons name={item.icon as any} size={24} color="#F97316" />
              </View>
              <Text className="w-16 text-center text-[10px] font-semibold text-primary">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-black text-primary">Event Saya</Text>
          <TouchableOpacity onPress={() => goTo('EventSaya')}>
            <Text className="text-[10px] font-extrabold text-accent">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {latestEvent && latestStatus && latestLocation ? (
          <TouchableOpacity
            className="mb-5 flex-row rounded-[24px] border border-slate-100 bg-white p-4"
            style={{ elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
            onPress={() => navigation.getParent()?.navigate('EventSaya', { screen: 'DetailEventClient', params: { eventId: latestEvent.id } })}
          >
            <Image source={{ uri: getAssetUrl(getEventImage(latestEvent)) || getEventImage(latestEvent) }} className="mr-3 h-20 w-20 rounded-xl" resizeMode="cover" />
            <View className="flex-1">
              <View className="mb-2.5 flex-row items-start justify-between">
                <Text className="mr-3 flex-1 text-sm font-extrabold text-primary" numberOfLines={1}>{latestEvent.name}</Text>
                <StatusBadge label={latestStatus.clientLabel} bg={latestStatus.bg} text={latestStatus.text} />
              </View>
              <View className="mb-1 flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text className="ml-1 text-xs text-slate-500">{formatDate(latestEvent.event_date)}</Text>
              </View>
              <View className="mb-3 flex-row items-center">
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text className="ml-1 flex-1 text-xs text-slate-500" numberOfLines={1}>{latestLocation.venue}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <ProgressBar progress={latestStatus.progress} />
                </View>
                <Text className="ml-2 text-xs font-bold text-primary">{latestStatus.progress}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="mb-5">
            <EmptyState icon="calendar-outline" title="Belum ada event" description="Booking event akan langsung masuk ke request dashboard admin." />
          </View>
        )}

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-black text-primary">Penawaran Spesial</Text>
          <Text className="text-[10px] font-extrabold text-accent">Lihat Semua</Text>
        </View>
        <View
          className="mb-5 flex-row rounded-[24px] border border-orange-100 bg-orange-50 p-4"
          style={{ elevation: 1, shadowColor: '#F97316', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Ionicons name="pricetag-outline" size={20} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-[8px] font-bold tracking-wider text-slate-400 mb-0.5">PENAWARAN SPESIAL</Text>
            <Text className="text-sm font-extrabold text-primary">Paket Wedding</Text>
            <View className="mt-1.5 flex-row items-center gap-2">
              <StatusBadge label="Diskon 15%" bg="bg-orange-100" text="text-accent" />
              <Text className="text-[10px] text-slate-400">Bulan Juni 2026</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </View>
    </View>
  );
};
