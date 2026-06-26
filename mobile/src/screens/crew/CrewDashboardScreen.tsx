import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, InfoRow, ProgressBar, StatusBadge } from '../../components/FndUi';
import { formatDate, getEventStatusMeta, getLocationParts, initials } from '../../utils/fnd';

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
      borderColor: '#E2E8F0', // slate-200
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
          <TouchableOpacity onPress={openNotifications} className="relative h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-danger">
              <Text className="text-[8px] font-bold text-white">3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="flex-row items-center" onPress={openProfile}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-11 w-11 rounded-full border border-white/20 bg-slate-800" />
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
      <View className="-mt-4 flex-1 rounded-t-[24px] bg-crewBg px-4 pt-5">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Stats Card Container */}
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
                  <TouchableOpacity
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
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Upcoming Event Promo Card */}
          <View 
            className="mb-4 flex-row rounded-[24px] border border-orange-100 bg-orange-50 p-4"
            style={{ 
              elevation: 1, 
              shadowColor: '#F97316', 
              shadowOpacity: 0.05, 
              shadowRadius: 6, 
              shadowOffset: { width: 0, height: 2 } 
            }}
          >
            <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Ionicons name="megaphone-outline" size={20} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="text-[8px] font-bold tracking-wider text-slate-400 text-uppercase mb-0.5">UPCOMING EVENT CARD</Text>
              <Text className="text-sm font-extrabold text-primary">Live Music Event</Text>
              <View className="mt-1.5 flex-row items-center gap-2">
                <StatusBadge label="Menunggu" bg="bg-crewAccent/10" text="text-crewAccent" />
                <Text className="text-[10px] text-slate-400">18 Juni 2026</Text>
              </View>
            </View>
          </View>

          {/* Progress Tracker Widget */}
          {activeTasks.slice(0, 1).map((task) => {
            const status = getEventStatusMeta(task.status);
            return (
              <View key={`progress-${task.id}`} className="mb-4 rounded-[24px] bg-slate-100/50 p-4 border border-slate-100">
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-[10px] font-bold text-slate-500">Progress event aktif</Text>
                  <Text className="text-[10px] font-extrabold text-primary">{status.progress}%</Text>
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
    borderRadius: 12,
    backgroundColor: '#F8FAFC', // slate-50/crewBg
    borderWidth: 1,
    borderColor: '#F1F5F9', // slate-100
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
    color: '#64748B', // slate-500
    lineHeight: 9,
  }
});
