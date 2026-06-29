import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, FndHeader, InfoRow, LoadingState, StatusBadge, TugasCardSkeleton } from '../../components/FndUi';
import { formatDate, getEventStatusMeta, getLocationParts, getEventImage } from '../../utils/fnd';

const FILTER_OPTIONS = ['Semua Status', 'Selesai', 'Dibatalkan'];

// Helper to assign a thematic emoji based on event name
const getEventEmoji = (name: string) => {
  const cleanName = String(name || '').toLowerCase();
  if (cleanName.includes('wedding') || cleanName.includes('nikah') || cleanName.includes('sinta')) return '💍';
  if (cleanName.includes('corporate') || cleanName.includes('gathering')) return '🏢';
  return '🎵';
};

// Helper to assign a gradient bg styling based on event name
const getEventBgClass = (name: string) => {
  const cleanName = String(name || '').toLowerCase();
  if (cleanName.includes('wedding')) return 'bg-indigo-950';
  if (cleanName.includes('corporate')) return 'bg-emerald-950';
  return 'bg-purple-950';
};

export const RiwayatTugasScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Semua Status');
  const [showFilter, setShowFilter] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/events/assigned');
      if (response.data?.success) setTasks(response.data.data || []);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal memuat riwayat tugas');
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

  const history = useMemo(
    () => tasks.filter((task) => ['selesai', 'cancel'].includes(String(task.status).toLowerCase())),
    [tasks],
  );

  const filtered = history.filter((task) => {
    // Search query filter
    const nameMatch = String(task.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    // Dropdown filter
    if (filter === 'Semua Status') return true;
    const label = getEventStatusMeta(task.status).label;
    return label === filter;
  });

  if (loading) {
    return (
      <View className="flex-1 bg-crewBg dark:bg-[#0B1120]">
        <FndHeader title="Riwayat Tugas" dark onBack={() => navigation.goBack()} />
        <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-2.5">
            <View className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <View className="w-20 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
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
      <FndHeader title="Riwayat Tugas" dark onBack={() => navigation.goBack()} />

      {/* Advanced Search Section */}
      <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Ionicons name="search-outline" size={14} color="#94A3B8" />
            <TextInput
              placeholder="Advanced Search"
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-xs p-0 font-medium text-primary dark:text-slate-100"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowFilter(!showFilter)}
            className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5"
          >
            <Ionicons name="funnel-outline" size={14} color="#475569" />
            <Text className="ml-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown overlay */}
        {showFilter ? (
          <View className="mt-2.5 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg" style={{ elevation: 5 }}>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                className={`px-4 py-3 ${option === filter ? 'bg-orange-50/20 dark:bg-orange-900/20' : 'bg-white dark:bg-slate-900'}`}
                onPress={() => {
                  setFilter(option);
                  setShowFilter(false);
                }}
              >
                <Text className={`text-xs font-bold ${option === filter ? 'text-crewAccent' : 'text-primary dark:text-slate-300'}`}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Filter Quick Chips */}
      <View className="flex-row gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <View className="bg-crewAccent px-3 py-1.5 rounded-full shadow-sm shadow-crewAccent/25">
          <Text className="text-[9px] font-black text-white">Rating Badge</Text>
        </View>
        <View className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full">
          <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Performance Score</Text>
        </View>
        <View className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full">
          <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Infinite Scroll</Text>
        </View>
      </View>

      {/* List items with horizontal split thumbnail layout */}
      <ScrollView
        className="flex-1 px-4 mt-3.5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="time-outline" title="Belum ada riwayat" description="Tugas selesai atau dibatalkan akan muncul di sini." />
        ) : (
          filtered.map((task) => {
            const status = getEventStatusMeta(task.status);
            const location = getLocationParts(task);
            const isDone = String(task.status).toLowerCase() === 'selesai';
            const emoji = getEventEmoji(task.name);
            const bgClass = getEventBgClass(task.name);

            const imageUrl = getAssetUrl(getEventImage(task)) || getEventImage(task);

            return (
              <TouchableOpacity
                key={task.id}
                className="mb-3 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex-row"
                style={{ 
                  elevation: 2, 
                  shadowColor: '#0F172A', 
                  shadowOpacity: 0.04, 
                  shadowRadius: 8, 
                  shadowOffset: { width: 0, height: 3 } 
                }}
                onPress={() => navigation.navigate('DetailTugas', { taskId: task.id, event: task })}
              >
                {/* Left Thumbnail Section */}
                <View className="w-20 bg-slate-800 items-center justify-center relative">
                  <Animated.Image 
                    {...({ sharedTransitionTag: `event-hero-${task.id}` } as any)}
                    source={{ uri: imageUrl }} 
                    className="absolute inset-0 h-full w-full" 
                    resizeMode="cover" 
                  />
                  <View className="absolute inset-0 bg-black/40" />
                </View>

                {/* Right Body Section */}
                <View className="flex-1 p-3.5">
                  <Text className="mb-2 text-xs font-black text-primary dark:text-slate-100" numberOfLines={2}>{task.name}</Text>
                  
                  <InfoRow icon="location-outline" title={location.venue} dense />
                  <InfoRow icon="calendar-outline" title={formatDate(task.event_date)} dense />
                  
                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <View className="flex-row items-center bg-orange-50 px-2 py-0.5 rounded-md">
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text className="ml-1 text-[9px] font-black text-crewAccent">
                        {isDone ? '5.0' : '4.0'}
                      </Text>
                    </View>
                    <StatusBadge 
                      label={status.label} 
                      bg={isDone ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-orange-50 dark:bg-orange-950'} 
                      text={isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
