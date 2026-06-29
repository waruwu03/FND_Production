import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, InfoRow, ProgressBar, StatusBadge } from '../../components/FndUi';
import { formatDate, getEventStatusMeta, getLocationParts, initials } from '../../utils/fnd';
import { AnimatedButton } from '../../components/AnimatedButton';

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 40;

const CAROUSEL_ITEMS = [
  {
    id: 1,
    title: 'SAFETY FIRST',
    subtitle: 'Prioritaskan keselamatan\ndalam setiap pemasangan',
    image: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=900&q=80',
    action: 'Tugas'
  },
  {
    id: 2,
    title: 'TARGET BULANAN',
    subtitle: 'Capai target penyelesaian\ntugas Anda bulan ini',
    image: 'https://images.unsplash.com/photo-1516280440502-8693c06637ee?w=900&q=80',
    action: 'Tugas'
  },
  {
    id: 3,
    title: 'CREW BRIEFING',
    subtitle: 'Baca panduan instalasi\nterbaru dari admin',
    image: 'https://images.unsplash.com/photo-1540324155974-7523202daa3f?w=900&q=80',
    action: 'Notifikasi'
  },
];

const INFINITE_ITEMS = [
  { ...CAROUSEL_ITEMS[CAROUSEL_ITEMS.length - 1], uid: 'fake_last' },
  ...CAROUSEL_ITEMS.map(item => ({ ...item, uid: `real_${item.id}` })),
  { ...CAROUSEL_ITEMS[0], uid: 'fake_first' },
];

const QUICK_MENU = [
  { label: 'Tugas Aktif', icon: 'briefcase', screen: 'Tugas', bg: '#FFF7ED', color: '#F97316' },
  { label: 'Check-In', icon: 'scan-circle', screen: 'CheckIn', bg: '#EFF6FF', color: '#3B82F6' },
  { label: 'Laporan', icon: 'document-text', screen: 'Profil', params: { screen: 'RiwayatTugas' }, bg: '#F5F3FF', color: '#8B5CF6' },
  { label: 'Profil', icon: 'person', screen: 'Profil', bg: '#F0FDF4', color: '#22C55E' },
];

const CircularProgress = ({ percentage, color = '#F97316', size = 32, strokeWidth = 2.5, children }: any) => {
  const borderStyle: any = {
    borderColor: 'transparent',
  };
  
  if (percentage > 0) borderStyle.borderTopColor = color;
  if (percentage >= 25) borderStyle.borderRightColor = color;
  if (percentage >= 50) borderStyle.borderBottomColor = color;
  if (percentage >= 75) borderStyle.borderLeftColor = color;

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <View style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          transform: [{ rotate: '-45deg' }]
        },
        borderStyle
      ]} />
      {children}
    </View>
  );
};

export const CrewDashboardScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const avatarUrl = getAssetUrl(user?.avatar_url);

  const fetchTasks = async () => {
    const response = await api.get('/events/assigned');
    if (response.data?.success) {
      setTasks(response.data.data || []);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks().catch(() => null);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks().catch(() => null);
    setRefreshing(false);
  };

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(1);

  React.useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: CAROUSEL_WIDTH, animated: false });
    }, 50);
  }, []);

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

  const activeTasks = useMemo(
    () => tasks.filter((task) => !['selesai', 'cancel'].includes(String(task.status).toLowerCase())),
    [tasks],
  );
  const completedTasks = tasks.filter((task) => String(task.status).toLowerCase() === 'selesai');
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((task) => String(task.event_date || '').startsWith(today));
  const primaryTasks = (todayTasks.length ? todayTasks : activeTasks).slice(0, 2);

  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const taskPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const activeEvent = activeTasks[0];
  const activeEventProgress = activeEvent ? getEventStatusMeta(activeEvent.status).progress : 0;

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const openNotifications = () => navigation.getParent()?.navigate('Notifikasi');
  const openProfile = () => navigation.getParent()?.navigate('Profil');

  const goTo = (screen: string, params?: any) => {
    if (screen === 'Notifikasi' || screen === 'Profil') {
      navigation.getParent()?.navigate(screen, params);
    } else {
      navigation.navigate(screen, params);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      {/* Header section with Dark Navy background */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-5 pb-7">
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-xs font-black tracking-widest text-white">FND PRODUCTION</Text>
            <Text className="text-[8px] font-semibold tracking-widest text-slate-400">CREW APP</Text>
          </View>
          <TouchableOpacity onPress={openNotifications} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="flex-row items-center" onPress={openProfile}>
          {avatarUrl ? (
            <Image key={avatarUrl} source={{ uri: avatarUrl }} className="h-11 w-11 rounded-full border border-white/20 bg-slate-800" />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <Text className="font-bold text-white text-xs">{initials(user?.name)}</Text>
            </View>
          )}
          <View className="ml-3.5 flex-1">
            <Text className="text-base font-extrabold text-white" numberOfLines={1}>
              Halo, {user?.name || 'Andi Setiawan'}
            </Text>
            <Text className="text-[10px] text-slate-400">{user?.email || 'crew@fnd.com'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main body with light off-white background */}
      <View className="-mt-4 flex-1 rounded-t-[24px] bg-crewBg">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 }}
        >
          {/* Infinite Carousel Banner */}
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
                    <AnimatedButton className="self-start rounded-full bg-crewAccent px-5 py-2.5" onPress={() => goTo(item.action)}>
                      <Text className="text-xs font-black text-white">Lihat Detail</Text>
                    </AnimatedButton>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View className="mt-4 flex-row justify-center">
              {CAROUSEL_ITEMS.map((_, index) => (
                <View 
                  key={index} 
                  className={`mx-1 h-1.5 rounded-full ${activeIndicator === index ? 'w-6 bg-crewAccent' : 'w-2 bg-slate-300'}`} 
                />
              ))}
            </View>
          </View>

          {/* Quick Menu */}
          <View className="mb-8 mt-2 flex-row justify-between px-2">
            {QUICK_MENU.map((item) => (
              <AnimatedButton key={item.label} className="items-center" onPress={() => goTo(item.screen, item.params)}>
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

          {/* Stats Card Container (Premium Glassmorphism-like style) */}
          <View 
            className="mb-5 rounded-[24px] border border-slate-100 bg-white p-4"
            style={{ 
              elevation: 4, 
              shadowColor: '#0F172A', 
              shadowOpacity: 0.05, 
              shadowRadius: 10, 
              shadowOffset: { width: 0, height: 4 } 
            }}
          >
            <Text className="text-xs font-black text-primary mb-3">Performa Bulan Ini</Text>
            <View style={dashboardStyles.gridContainer}>
              {/* Stat item 1: Tugas Selesai */}
              <View style={dashboardStyles.statCard}>
                <CircularProgress percentage={taskPercentage} color="#F97316">
                  <Text style={dashboardStyles.circleText}>{taskPercentage}%</Text>
                </CircularProgress>
                <View style={dashboardStyles.textContainer}>
                  <Text style={dashboardStyles.statValue}>{completedCount}</Text>
                  <Text style={dashboardStyles.statLabel} numberOfLines={1}>Tugas Selesai</Text>
                </View>
              </View>

              {/* Stat item 2: Event Terkumpul */}
              <View style={dashboardStyles.statCard}>
                <CircularProgress percentage={totalCount > 0 ? 100 : 0} color="#3B82F6">
                  <Text style={dashboardStyles.circleText}>{totalCount}</Text>
                </CircularProgress>
                <View style={dashboardStyles.textContainer}>
                  <Text style={dashboardStyles.statValue}>{totalCount}</Text>
                  <Text style={dashboardStyles.statLabel} numberOfLines={1}>Event</Text>
                </View>
              </View>

              {/* Stat item 3: Progres Event */}
              <View style={dashboardStyles.statCard}>
                <CircularProgress percentage={activeEventProgress} color="#10B981">
                  <Text style={dashboardStyles.circleText}>{activeEventProgress}%</Text>
                </CircularProgress>
                <View style={dashboardStyles.textContainer}>
                  <Text style={dashboardStyles.statValue}>{activeEventProgress}%</Text>
                  <Text style={dashboardStyles.statLabel} numberOfLines={1}>Progres Event</Text>
                </View>
              </View>

              {/* Stat item 4: Rating */}
              <View style={dashboardStyles.statCard}>
                <CircularProgress percentage={96} color="#F59E0B">
                  <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: 'bold' }}>★</Text>
                </CircularProgress>
                <View style={dashboardStyles.textContainer}>
                  <Text style={dashboardStyles.statValue}>4.8</Text>
                  <Text style={dashboardStyles.statLabel} numberOfLines={1}>Rating Kinerja</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Today's Tasks Section */}
          <View className="mb-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-black text-primary">Today's Tasks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tugas')}>
                <Text className="text-[10px] font-extrabold text-crewAccent">Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {primaryTasks.length === 0 ? (
              <EmptyState icon="calendar-outline" title="Belum ada tugas aktif" description="Assignment dari admin akan muncul di sini." />
            ) : (
              primaryTasks.map((task, index) => {
                const status = getEventStatusMeta(task.status);
                const location = getLocationParts(task);
                const isOngoing = status.label.toLowerCase() === 'on going';
                return (
                  <AnimatedButton
                    key={task.id}
                    className="mb-3 rounded-[24px] border border-slate-100 bg-white p-4"
                    style={{ 
                      elevation: 2, 
                      shadowColor: '#0F172A', 
                      shadowOpacity: 0.03, 
                      shadowRadius: 8, 
                      shadowOffset: { width: 0, height: 3 } 
                    }}
                    onPress={() => navigation.navigate('DetailTugas', { taskId: task.id, event: task })}
                  >
                    <View className="mb-2.5 flex-row items-start justify-between">
                      <Text className="mr-3 flex-1 text-sm font-extrabold text-primary" numberOfLines={1}>{task.name}</Text>
                      <StatusBadge 
                        label={status.label} 
                        bg={isOngoing ? 'bg-emerald-50' : 'bg-blue-50'} 
                        text={isOngoing ? 'text-emerald-600' : 'text-blue-600'} 
                      />
                    </View>
                    <InfoRow icon="location-outline" title={location.venue} dense />
                    <InfoRow icon="time-outline" title={`${formatDate(task.event_date)} - Selesai`} dense />
                  </AnimatedButton>
                );
              })
            )}
          </View>

          {/* Progress Tracker Widget */}
          {activeTasks.slice(0, 1).map((task) => {
            const status = getEventStatusMeta(task.status);
            return (
              <View key={`progress-${task.id}`} className="mb-4 rounded-[24px] bg-white p-4 border border-slate-100 shadow-sm">
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-[10px] font-bold text-slate-500">Progress event aktif</Text>
                  <Text className="text-[10px] font-extrabold text-crewAccent">{status.progress}%</Text>
                </View>
                <ProgressBar progress={status.progress} color="#F97316" />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const dashboardStyles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  circleText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  textContainer: {
    marginLeft: 6,
    flex: 1,
  },
  statValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 13,
  },
  statLabel: {
    fontSize: 7.5,
    color: '#64748B',
    lineHeight: 9,
  }
});

