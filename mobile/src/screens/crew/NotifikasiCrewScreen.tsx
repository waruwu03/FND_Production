import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { EmptyState } from '../../components/FndUi';
import { formatDate, getEventStatusMeta } from '../../utils/fnd';
import { AnimatedButton } from '../../components/AnimatedButton';

const FILTERS = ['Semua', 'Belum Dibaca'];

export const NotifikasiCrewScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Semua');
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readNotifs, setReadNotifs] = useState<string[]>([]);

  const fetchTasks = async () => {
    const response = await api.get('/events/assigned');
    if (response.data?.success) setTasks(response.data.data || []);
  };

  const loadReadNotifs = async () => {
    try {
      const stored = await AsyncStorage.getItem('crew_read_notifications');
      if (stored) setReadNotifs(JSON.parse(stored));
    } catch (e) {}
  };

  const markAsRead = async (id: string) => {
    if (readNotifs.includes(id)) return;
    const updated = [...readNotifs, id];
    setReadNotifs(updated);
    try {
      await AsyncStorage.setItem('crew_read_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifs(allIds);
    try {
      await AsyncStorage.setItem('crew_read_notifications', JSON.stringify(allIds));
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks().catch(() => null);
      loadReadNotifs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks().catch(() => null);
    setRefreshing(false);
  };

  const notifications = useMemo(() => {
    return tasks.map((task) => {
      const status = getEventStatusMeta(task.status);
      const isNew = String(task.status).toLowerCase() === 'pending' || String(task.status).toLowerCase() === 'survey' || String(task.status).toLowerCase() === 'deal';
      const isDone = String(task.status).toLowerCase() === 'selesai';
      const isCancel = String(task.status).toLowerCase() === 'cancel';
      
      let title = 'Update Status Tugas';
      let icon = 'calendar-outline';
      let priorityColor = '#3B82F6'; // Blue
      let iconBg = 'bg-blue-50';
      
      if (isNew) {
        title = 'Tugas Baru Diberikan';
        icon = 'briefcase-outline';
        priorityColor = '#F97316'; // Orange
        iconBg = 'bg-orange-50';
      } else if (isDone) {
        title = 'Tugas Selesai';
        icon = 'checkmark-circle-outline';
        priorityColor = '#10B981'; // Green
        iconBg = 'bg-emerald-50';
      } else if (isCancel) {
        title = 'Tugas Dibatalkan';
        icon = 'close-circle-outline';
        priorityColor = '#EF4444'; // Red
        iconBg = 'bg-red-50';
      }

      return {
        id: `task-${task.id}-${task.status}`, // unique per status change
        title,
        desc: `${task.name} saat ini berstatus ${status.label}. Cek detail pekerjaan Anda.`,
        time: formatDate(task.updated_at || task.event_date),
        icon,
        iconBg,
        iconColor: priorityColor,
        event: task,
      };
    }).sort((a, b) => new Date(b.event.updated_at || b.event.event_date).getTime() - new Date(a.event.updated_at || a.event.event_date).getTime());
  }, [tasks]);

  const mappedNotifications = notifications.map(n => ({
    ...n,
    isRead: readNotifs.includes(n.id)
  }));

  const filtered = mappedNotifications.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === 'Belum Dibaca') return !item.isRead;
    return true;
  });

  const unreadCount = mappedNotifications.filter(n => !n.isRead).length;

  return (
    <View className="flex-1 bg-crewBg">
      <View style={{ paddingTop: insets.top + 10 }} className="bg-primary px-5 pb-5">
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer()} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-base font-extrabold text-white">Notifikasi</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full relative" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="notifications" size={18} color="#F97316" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border border-primary" />
            )}
          </View>
        </View>

        <View className="flex-row items-center rounded-xl px-3.5 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Cari notifikasi..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="flex-1 ml-2.5 text-white text-xs p-0 font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="bg-primary pb-3 px-4 flex-row justify-between items-center">
        <View className="flex-row rounded-[14px] p-1 w-2/3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          {FILTERS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              className={`flex-1 items-center rounded-[10px] py-2 ${filter === tab ? 'bg-white' : ''}`}
              style={filter === tab ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            >
              <Text className={`text-[11px] font-bold ${filter === tab ? 'text-primary' : ''}`} style={filter !== tab ? { color: 'rgba(255,255,255,0.6)' } : undefined}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} className="px-2 py-2">
            <Text className="text-[10px] font-bold text-crewAccent">Tandai Semua Dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 mt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="notifications-outline" title="Belum ada notifikasi" description="Notifikasi tugas baru akan muncul di sini." />
        ) : (
          filtered.map((notif: any) => (
            <AnimatedButton
              key={notif.id}
              className={`mb-3 flex-row items-center rounded-2xl border ${!notif.isRead ? 'bg-orange-50' : 'border-slate-100 bg-white'} p-4`}
              style={{ elevation: !notif.isRead ? 2 : 1, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, ...(!notif.isRead ? { borderColor: 'rgba(249,115,22,0.3)' } : {}) }}
              onPress={() => {
                markAsRead(notif.id);
                if (notif.event) navigation.navigate('DetailTugas', { taskId: notif.event.id, event: notif.event });
              }}
            >
              <View className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl border border-white ${notif.iconBg}`} style={{ elevation: 2, shadowColor: notif.iconColor, shadowOpacity: 0.2, shadowRadius: 8 }}>
                <Ionicons name={notif.icon as any} size={20} color={notif.iconColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <Text className="mr-3 flex-1 text-sm font-extrabold text-primary">{notif.title}</Text>
                  {!notif.isRead && <View className="h-2 w-2 rounded-full bg-crewAccent mt-1.5" />}
                </View>
                <Text className="mt-1 text-xs leading-5 text-slate-500" numberOfLines={2}>{notif.desc}</Text>
                <Text className="mt-2 text-[10px] font-bold text-slate-400">{notif.time}</Text>
              </View>
            </AnimatedButton>
          ))
        )}
      </ScrollView>
    </View>
  );
};

