import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { EmptyState, FndHeader } from '../../components/FndUi';
import { formatDate, getEventStatusMeta } from '../../utils/fnd';

const FILTERS = ['Semua', 'Belum Dibaca'];

export const NotifikasiCrewScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Semua');
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    const response = await api.get('/events/assigned');
    if (response.data?.success) setTasks(response.data.data || []);
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

  const notifications = useMemo(() => {
    const generated = tasks.slice(0, 8).map((task, index) => {
      const status = getEventStatusMeta(task.status);
      return {
        id: `task-${task.id}`,
        title: index === 0 ? 'Tugas baru diberikan' : 'Update event',
        desc: `${task.name} berstatus ${status.label}. Cek detail pekerjaan Anda.`,
        time: formatDate(task.event_date),
        icon: index === 0 ? 'briefcase' : 'calendar',
        iconBg: index === 0 ? 'bg-blue-100' : 'bg-emerald-100',
        iconColor: index === 0 ? '#2563EB' : '#059669',
        isRead: index > 1,
        event: task,
      };
    });

    return [
      ...generated,
      {
        id: 'announcement',
        title: 'Pengumuman',
        desc: 'Briefing crew untuk event berikutnya jam 19.00 di basecamp FND Production.',
        time: 'Admin',
        icon: 'megaphone',
        iconBg: 'bg-orange-100',
        iconColor: '#F97316',
        isRead: false,
      },
    ];
  }, [tasks]);

  const unread = notifications.filter((item) => !item.isRead).length;
  const filtered = filter === 'Belum Dibaca' ? notifications.filter((item) => !item.isRead) : notifications;

  return (
    <View className="flex-1 bg-crewBg">
      {/* Redesigned Notification Header with Toggle Switch */}
      <View style={{ paddingTop: insets.top + 10 }} className="bg-primary px-5 pb-5">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-white">Notification center</Text>
          
          {/* Simulated Toggle Switch */}
          <View className="h-6 w-11 rounded-full bg-crewAccent flex-row items-center justify-end px-0.5">
            <View className="h-5 w-5 rounded-full bg-white shadow-sm" />
          </View>
        </View>

        {/* Subtitle Indicators */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-crewAccent mr-1" />
            <Text className="text-[9px] font-bold text-slate-400">Priority Color</Text>
          </View>
          <Text className="text-[9px] font-bold text-slate-400">Swipe Action</Text>
          <Text className="text-[9px] font-bold text-slate-400">Read/Unread Indicator</Text>
        </View>

        {/* Search & Actions Bar */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
            <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder="Search notifications..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-1 ml-2 text-white text-xs p-0 font-medium"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/10">
            <Ionicons name="funnel-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/10">
            <Ionicons name="options-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className="px-5 pt-6">
            <EmptyState icon="notifications-outline" title="Belum ada notifikasi" />
          </View>
        ) : (
          <>
            {/* Timestamp Group 1: 15-Mei */}
            <View className="px-4 py-2.5">
              <Text className="text-[9px] font-black tracking-wider text-slate-400 text-uppercase">15-MEI</Text>
            </View>

            {filtered.slice(0, 3).map((notif: any) => {
              // Priority colors: Orange, Blue, Green
              let priorityColor = '#F97316';
              if (notif.title.toLowerCase().includes('update')) priorityColor = '#3B82F6';
              if (notif.title.toLowerCase().includes('pengingat')) priorityColor = '#10B981';

              return (
                <TouchableOpacity
                  key={notif.id}
                  className="mx-4 mb-2 flex-row items-center rounded-2xl border border-slate-50 p-3"
                  style={!notif.isRead ? { backgroundColor: 'rgba(255, 237, 213, 0.5)', elevation: 1 } : { backgroundColor: '#FFFFFF', elevation: 1 }}
                  onPress={() => notif.event && navigation.navigate('DetailTugas', { taskId: notif.event.id, event: notif.event })}
                >
                  <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                    <Ionicons name={notif.icon === 'briefcase' ? 'briefcase-outline' : notif.icon === 'calendar' ? 'calendar-outline' : 'megaphone-outline'} size={16} color={priorityColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <Text className="mr-3 flex-1 text-xs font-black text-primary">{notif.title}</Text>
                      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityColor }} />
                    </View>
                    <Text className="mt-0.5 text-[10px] leading-4 text-slate-500" numberOfLines={1}>{notif.desc}</Text>
                    <Text className="mt-1 text-[8px] font-bold text-slate-400">{notif.time}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Swipe Indication Banner Widget */}
            <View className="mx-4 my-2.5 rounded-xl bg-slate-100/60 p-2.5 items-center border border-slate-200/50">
              <Text className="text-[9px] font-bold text-slate-500">← Swipe left to delete | Swipe right to read →</Text>
            </View>

            {/* Timestamp Group 2: 13-Do */}
            <View className="px-4 py-2.5">
              <Text className="text-[9px] font-black tracking-wider text-slate-400 text-uppercase">13-DO</Text>
            </View>

            {filtered.slice(3).map((notif: any) => (
              <TouchableOpacity
                key={notif.id}
                className="mx-4 mb-2 flex-row items-center rounded-2xl border border-slate-50 p-3"
                style={!notif.isRead ? { backgroundColor: 'rgba(255, 237, 213, 0.5)', elevation: 1 } : { backgroundColor: '#FFFFFF', elevation: 1 }}
                onPress={() => notif.event && navigation.navigate('DetailTugas', { taskId: notif.event.id, event: notif.event })}
              >
                <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  <Ionicons name="megaphone-outline" size={16} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start justify-between">
                    <Text className="mr-3 flex-1 text-xs font-black text-primary">{notif.title}</Text>
                    {!notif.isRead ? <View className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : null}
                  </View>
                  <Text className="mt-0.5 text-[10px] leading-4 text-slate-500" numberOfLines={1}>{notif.desc}</Text>
                  <Text className="mt-1 text-[8px] font-bold text-slate-400">{notif.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};
