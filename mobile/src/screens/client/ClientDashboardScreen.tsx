import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { AnimatedButton } from '../../components/AnimatedButton';
import { Skeleton } from '../../components/Skeleton';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { useGetEventsQuery } from '../../services/apiSlice';
import { EmptyState, ProgressBar, StatusBadge } from '../../components/FndUi';
import { formatDate, getEventImage, getEventStatusMeta, getLocationParts, initials } from '../../utils/fnd';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 40;

const CAROUSEL_ITEMS = [
  {
    id: 1,
    title: 'WEDDING PACKAGE',
    subtitle: 'Make Your Special Day\nMore Perfect',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80',
    action: 'Booking'
  },
  {
    id: 2,
    title: 'CORPORATE EVENT',
    subtitle: 'Professional Setup for\nYour Business Needs',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80',
    action: 'Booking'
  },
  {
    id: 3,
    title: 'MUSIC FESTIVAL',
    subtitle: 'Ultimate Lighting &\nSound Experience',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900&q=80',
    action: 'Booking'
  },
];

const INFINITE_ITEMS = [
  { ...CAROUSEL_ITEMS[CAROUSEL_ITEMS.length - 1], uid: 'fake_last' },
  ...CAROUSEL_ITEMS.map(item => ({ ...item, uid: `real_${item.id}` })),
  { ...CAROUSEL_ITEMS[0], uid: 'fake_first' },
];

const QUICK_MENU = [
  { label: 'Booking', icon: 'calendar', screen: 'Booking', bg: '#FFF7ED', color: '#F97316' },
  { label: 'Layanan', icon: 'layers', screen: 'Layanan', bg: '#EFF6FF', color: '#3B82F6' },
  { label: 'Galeri', icon: 'images', screen: 'Galeri', bg: '#F5F3FF', color: '#8B5CF6' },
  { label: 'Promo', icon: 'ticket', screen: 'Promo', bg: '#FEF2F2', color: '#EF4444' },
];

export const ClientDashboardScreen = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  const { data: events = [], isLoading, isFetching, refetch } = useGetEventsQuery();
  const loading = isLoading;
  const refreshing = isFetching && !isLoading;
  const avatarUrl = getAssetUrl(user?.avatar_url);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    refetch();
  };

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(1);

  // Initial scroll to real first item
  React.useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: CAROUSEL_WIDTH, animated: false });
    }, 50);
  }, []);

  // Auto-play carousel
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        scrollViewRef.current?.scrollTo({
          x: next * CAROUSEL_WIDTH,
          animated: true,
        });

        if (next === INFINITE_ITEMS.length - 1) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: 1 * CAROUSEL_WIDTH,
              animated: false,
            });
          }, 350);
          return 1;
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CAROUSEL_WIDTH);

    if (index === 0) {
      scrollViewRef.current?.scrollTo({ x: CAROUSEL_ITEMS.length * CAROUSEL_WIDTH, animated: false });
      setCurrentIndex(CAROUSEL_ITEMS.length);
    } else if (index === INFINITE_ITEMS.length - 1) {
      scrollViewRef.current?.scrollTo({ x: 1 * CAROUSEL_WIDTH, animated: false });
      setCurrentIndex(1);
    } else {
      setCurrentIndex(index);
    }
  };

  const activeIndicator = currentIndex === 0 
    ? CAROUSEL_ITEMS.length - 1 
    : currentIndex === INFINITE_ITEMS.length - 1 
      ? 0 
      : currentIndex - 1;

  const latestEvent = events.find((event: any) => !['selesai', 'cancel'].includes(String(event.status).toLowerCase())) || events[0];
  const latestStatus = latestEvent ? getEventStatusMeta(latestEvent.status) : null;
  const latestLocation = latestEvent ? getLocationParts(latestEvent) : null;

  const goTo = (screen: string) => {
    if (screen === 'Booking') {
      navigation.getParent()?.navigate('Booking');
    } else {
      navigation.navigate('Layanan');
    }
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
            <Image key={avatarUrl} source={{ uri: avatarUrl }} className="h-11 w-11 rounded-full border border-white/20 bg-slate-800" />
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 }}
      >
        <View className="mb-5">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {INFINITE_ITEMS.map((item) => (
              <View 
                key={item.uid} 
                style={{ width: CAROUSEL_WIDTH }} 
                className="overflow-hidden rounded-[24px] border border-slate-100 bg-primary"
              >
                <Image source={{ uri: item.image }} className="absolute h-full w-full opacity-55" resizeMode="cover" />
                <View className="min-h-[160px] justify-between p-6">
                  <View>
                    <Text className="text-xl font-black tracking-wide text-white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                      {item.title}
                    </Text>
                    <Text className="mt-2 text-xs font-medium leading-5 text-white/90">
                      {item.subtitle}
                    </Text>
                  </View>
                  <AnimatedButton className="self-start rounded-full bg-white px-5 py-2.5" onPress={() => goTo(item.action)}>
                    <Text className="text-xs font-black text-primary">Lihat Paket</Text>
                  </AnimatedButton>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className="mt-4 flex-row justify-center">
            {CAROUSEL_ITEMS.map((_, index) => (
              <View 
                key={index} 
                className={`mx-1 h-1.5 rounded-full ${activeIndicator === index ? 'w-6 bg-primary' : 'w-2 bg-slate-300'}`} 
              />
            ))}
          </View>
        </View>

        <View className="mb-8 mt-2 flex-row justify-between px-2">
          {QUICK_MENU.map((item) => (
            <AnimatedButton key={item.label} className="items-center" onPress={() => goTo(item.screen)}>
              <View 
                className="mb-2.5 h-[52px] w-[52px] items-center justify-center rounded-[18px]" 
                style={{ 
                  backgroundColor: item.bg,
                  elevation: 0, 
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.03)'
                }}
              >
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text className="text-center text-[11px] font-bold text-primary">{item.label}</Text>
            </AnimatedButton>
          ))}
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-black text-primary">Event Saya</Text>
          <TouchableOpacity onPress={() => goTo('EventSaya')}>
            <Text className="text-[10px] font-extrabold text-accent">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            className="mb-5 flex-row rounded-[24px] border border-slate-100 bg-white p-4"
            style={{ elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
          >
            <Skeleton width={80} height={80} borderRadius={12} style={{ marginRight: 12 }} />
            <View className="flex-1 justify-center">
              <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
              <Skeleton width="50%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={12} borderRadius={4} />
            </View>
          </View>
        ) : latestEvent && latestStatus && latestLocation ? (
          <AnimatedButton
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
          </AnimatedButton>
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
