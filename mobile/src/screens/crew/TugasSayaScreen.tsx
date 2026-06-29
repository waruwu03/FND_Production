import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, InfoRow, LoadingState, ProgressBar, StatusBadge, TugasCardSkeleton } from '../../components/FndUi';
import { formatDate, getEventStatusMeta, getLocationParts, getEventImage } from '../../utils/fnd';
import { AnimatedButton } from '../../components/AnimatedButton';

const TABS = ['Aktif', 'On Going', 'Selesai'];

// Helper to assign a thematic emoji based on event name
const getEventEmoji = (name: string) => {
  const cleanName = String(name || '').toLowerCase();
  if (cleanName.includes('wedding') || cleanName.includes('nikah') || cleanName.includes('sinta')) return '💍';
  if (cleanName.includes('corporate') || cleanName.includes('gathering') || cleanName.includes('perusahaan') || cleanName.includes('maju')) return '🏢';
  if (cleanName.includes('music') || cleanName.includes('konser') || cleanName.includes('festival') || cleanName.includes('live')) return '🎵';
  return '🎉';
};

// Helper to assign a gradient bg styling based on event name
const getEventBgClass = (name: string) => {
  const cleanName = String(name || '').toLowerCase();
  if (cleanName.includes('wedding')) return 'bg-indigo-950';
  if (cleanName.includes('corporate')) return 'bg-emerald-950';
  return 'bg-purple-950';
};

export const TugasSayaScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Aktif');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/events/assigned');
      if (response.data?.success) {
        setTasks(response.data.data || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal memuat tugas');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(true);
    setRefreshing(false);
  };

  // Filter tasks by active tab and search query
  const filteredTasks = tasks.filter((task) => {
    const nameMatch = String(task.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    const status = String(task.status).toLowerCase();
    if (activeTab === 'Aktif') {
      return ['pending', 'survey', 'deal'].includes(status);
    } else if (activeTab === 'On Going') {
      return ['running'].includes(status);
    } else {
      return ['selesai', 'cancel'].includes(status);
    }
  });

  if (loading) {
    return (
      <View className="flex-1 bg-crewBg dark:bg-[#0B1120]">
        <View style={{ paddingTop: insets.top + 10 }} className="bg-primary px-5 pb-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-9 w-9" />
            <Text className="text-base font-extrabold text-white">Daftar Tugas</Text>
            <View className="h-9 w-9" />
          </View>
        </View>
        <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
          <TugasCardSkeleton />
          <TugasCardSkeleton />
          <TugasCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-crewBg dark:bg-[#0B1120]">
      {/* Dark Navy Header Section with Search Bar */}
      <View style={{ paddingTop: insets.top + 10 }} className="bg-primary px-5 pb-5">
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-base font-extrabold text-white">Daftar Tugas</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Notifikasi')} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white/10 border border-white/10 rounded-xl px-3.5 py-2">
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="flex-1 ml-2.5 text-white text-xs p-0 font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Pill tabs Segmented Control */}
      <View className="bg-primary pb-3 px-4">
        <View className="flex-row rounded-[14px] bg-black/20 p-1 border border-white/5">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center rounded-[10px] py-2.5 ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-[11px] font-bold ${activeTab === tab ? 'text-primary' : 'text-white/60'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scrollable Tasks List */}
      <ScrollView
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {filteredTasks.length === 0 ? (
          <EmptyState icon="briefcase-outline" title="Belum ada tugas" description="Tugas dari dashboard admin akan muncul sesuai statusnya." />
        ) : (
          filteredTasks.map((task) => {
            const status = getEventStatusMeta(task.status);
            const location = getLocationParts(task);
            const emoji = getEventEmoji(task.name);
            const bgClass = getEventBgClass(task.name);

            // Progress tracking variables for visual representation
            const totalSteps = 9;
            const completedSteps = Math.round((status.progress / 100) * totalSteps);

            const imageUrl = getAssetUrl(getEventImage(task)) || getEventImage(task);

            return (
              <View
                key={task.id}
                className="mb-5 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                style={{ 
                  elevation: 6, 
                  shadowColor: '#0F172A', 
                  shadowOpacity: 0.08, 
                  shadowRadius: 16, 
                  shadowOffset: { width: 0, height: 6 } 
                }}
              >
                {/* Visual Thumbnail Banner */}
                <View className="h-16 relative items-center justify-center bg-slate-800">
                  <Animated.Image 
                    {...({ sharedTransitionTag: `event-hero-${task.id}` } as any)}
                    source={{ uri: imageUrl }} 
                    className="absolute inset-0 h-full w-full" 
                    resizeMode="cover" 
                  />
                  <View className="absolute inset-0 bg-black/40" />
                  <View className="absolute bottom-2.5 left-3">
                    <StatusBadge 
                      label={status.label} 
                      bg={status.label.toLowerCase() === 'on going' ? 'bg-emerald-500' : 'bg-blue-500'} 
                      text="text-white" 
                    />
                  </View>
                </View>

                {/* Card Info details */}
                <View className="p-4">
                  <Text className="mb-2 text-sm font-extrabold text-primary dark:text-slate-100" numberOfLines={1}>{task.name}</Text>
                  
                  <InfoRow icon="location-outline" title={location.venue} dense />
                  <InfoRow icon="time-outline" title={`${formatDate(task.event_date)} - Selesai`} dense />

                  {/* Progress tracker widget */}
                  <View className="mb-4 mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <View className="mb-2 flex-row justify-between items-center" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Progress Pengerjaan</Text>
                      <Text className="text-[10px] font-black text-crewAccent">{completedSteps}/{totalSteps}</Text>
                    </View>
                    <ProgressBar progress={status.progress} color="#F97316" />
                  </View>

                  <AnimatedButton
                    className="items-center rounded-xl bg-crewAccent py-3"
                    onPress={() => navigation.navigate('DetailTugas', { taskId: task.id, event: task })}
                  >
                    <Text className="text-xs font-bold text-white">Lihat Detail</Text>
                  </AnimatedButton>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
