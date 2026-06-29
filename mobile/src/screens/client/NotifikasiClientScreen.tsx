import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { EmptyState, FndHeader } from '../../components/FndUi';
import { formatDate, getEventStatusMeta } from '../../utils/fnd';
import { AnimatedButton } from '../../components/AnimatedButton';

const FILTERS = ['Semua', 'Belum Dibaca', 'Booking', 'Pembayaran'];

export const NotifikasiClientScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState('Semua');
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [readNotifs, setReadNotifs] = useState<string[]>([]);

  const fetchEvents = async () => {
    const response = await api.get('/events');
    if (response.data?.success) setEvents(response.data.data || []);
  };

  const loadReadNotifs = async () => {
    try {
      const stored = await AsyncStorage.getItem('client_read_notifications');
      if (stored) setReadNotifs(JSON.parse(stored));
    } catch (e) {}
  };

  const markAsRead = async (id: string) => {
    if (readNotifs.includes(id)) return;
    const updated = [...readNotifs, id];
    setReadNotifs(updated);
    try {
      await AsyncStorage.setItem('client_read_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifs(allIds);
    try {
      await AsyncStorage.setItem('client_read_notifications', JSON.stringify(allIds));
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents().catch(() => null);
      loadReadNotifs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents().catch(() => null);
    setRefreshing(false);
  };

  const notifications = useMemo(() => {
    const booking = events.map((event) => {
      const status = getEventStatusMeta(event.status);
      const isNew = String(event.status).toLowerCase() === 'pending';
      return {
        id: `event-${event.id}-${event.status}`,
        category: 'Booking',
        title: isNew ? 'Booking Dibuat' : 'Update Status Booking',
        desc: `Pemesanan ${event.name} saat ini berstatus ${status.clientLabel}.`,
        time: formatDate(event.updated_at || event.event_date),
        icon: isNew ? 'calendar-outline' : 'information-circle-outline',
        iconBg: isNew ? 'bg-orange-50' : 'bg-blue-50',
        iconColor: isNew ? '#F97316' : '#3B82F6',
        eventId: event.id,
        dateObj: new Date(event.updated_at || event.event_date)
      };
    });

    const payment = events
      .filter((event) => Number(event.paid_amount || 0) > 0)
      .map((event) => ({
        id: `payment-${event.id}-${event.paid_amount}`,
        category: 'Pembayaran',
        title: 'Pembayaran Diterima',
        desc: `Pembayaran sebesar Rp${Number(event.paid_amount).toLocaleString('id-ID')} untuk ${event.name} telah tercatat.`,
        time: formatDate(event.updated_at || event.event_date),
        icon: 'wallet-outline',
        iconBg: 'bg-emerald-50',
        iconColor: '#10B981',
        eventId: event.id,
        dateObj: new Date(event.updated_at || event.event_date)
      }));

    return [...booking, ...payment].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [events]);

  const mappedNotifications = notifications.map(n => ({
    ...n,
    isRead: readNotifs.includes(n.id)
  }));

  const filtered = mappedNotifications.filter((item) => {
    if (filter === 'Semua') return true;
    if (filter === 'Belum Dibaca') return !item.isRead;
    return item.category === filter;
  });

  const unreadCount = mappedNotifications.filter(n => !n.isRead).length;

  return (
    <View className="flex-1 bg-white">
      <FndHeader title="Notifikasi" dark onBack={() => navigation.goBack()} />

      <View className="px-5 pt-4 flex-row items-center justify-between">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              className={`mr-2 rounded-full px-4 py-2 ${filter === item ? 'bg-primary' : 'bg-slate-100'}`}
              onPress={() => setFilter(item)}
            >
              <Text className={`text-[11px] font-bold ${filter === item ? 'text-white' : 'text-slate-500'}`}>
                {item} {item === 'Belum Dibaca' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} className="ml-2 mb-3 bg-orange-50 px-3 py-2 rounded-full border border-orange-200">
            <Text className="text-[10px] font-bold text-orange-600">Tandai Dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 pt-2"
        contentContainerStyle={{ paddingBottom: 104, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {filtered.length === 0 ? (
          <View className="pt-6">
            <EmptyState icon="notifications-outline" title="Belum ada notifikasi" description="Notifikasi terbaru Anda akan muncul di sini." />
          </View>
        ) : (
          filtered.map((notif: any) => (
            <AnimatedButton
              key={notif.id}
              className={`mb-3 flex-row items-center rounded-2xl border ${!notif.isRead ? 'border-primary/10 bg-slate-50/50' : 'border-slate-100 bg-white'} p-4`}
              style={{ elevation: !notif.isRead ? 2 : 1, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
              onPress={() => {
                markAsRead(notif.id);
                if (notif.eventId) navigation.getParent()?.navigate('EventSaya', { screen: 'DetailEventClient', params: { eventId: notif.eventId } });
              }}
            >
              <View className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl border border-white ${notif.iconBg}`} style={{ elevation: 2, shadowColor: notif.iconColor, shadowOpacity: 0.2, shadowRadius: 8 }}>
                <Ionicons name={notif.icon as any} size={20} color={notif.iconColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <Text className="mr-3 flex-1 text-sm font-extrabold text-primary">{notif.title}</Text>
                  {!notif.isRead && <View className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
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
