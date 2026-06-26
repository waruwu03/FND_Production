import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { EmptyState, FndHeader } from '../../components/FndUi';
import { formatDate, getEventStatusMeta } from '../../utils/fnd';

const FILTERS = ['Semua', 'Booking', 'Pembayaran'];

export const NotifikasiClientScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState('Semua');
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    const response = await api.get('/events');
    if (response.data?.success) setEvents(response.data.data || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents().catch(() => null);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents().catch(() => null);
    setRefreshing(false);
  };

  const notifications = useMemo(() => {
    const booking = events.slice(0, 8).map((event) => {
      const status = getEventStatusMeta(event.status);
      return {
        id: `event-${event.id}`,
        category: 'Booking',
        title: status.clientLabel === 'Menunggu Konfirmasi' ? 'Booking dibuat' : 'Update event',
        desc: `${event.name} berstatus ${status.clientLabel}.`,
        time: formatDate(event.updated_at || event.event_date),
        icon: 'calendar',
        iconBg: 'bg-orange-100',
        iconColor: '#F97316',
        eventId: event.id,
      };
    });

    const payment = events
      .filter((event) => Number(event.paid_amount || 0) > 0)
      .slice(0, 4)
      .map((event) => ({
        id: `payment-${event.id}`,
        category: 'Pembayaran',
        title: 'Pembayaran diterima',
        desc: `Pembayaran untuk ${event.name} telah tercatat.`,
        time: formatDate(event.updated_at || event.event_date),
        icon: 'wallet',
        iconBg: 'bg-emerald-100',
        iconColor: '#059669',
        eventId: event.id,
      }));

    return [
      ...booking,
      ...payment,
      {
        id: 'promo',
        category: 'Promo',
        title: 'Promo paket wedding',
        desc: 'Diskon hingga 15% untuk paket wedding bulan ini.',
        time: 'FND Production',
        icon: 'pricetag',
        iconBg: 'bg-orange-100',
        iconColor: '#F97316',
      },
    ];
  }, [events]);

  const filtered = filter === 'Semua' ? notifications : notifications.filter((item) => item.category === filter);

  return (
    <View className="flex-1 bg-white">
      <FndHeader title="Notifikasi" dark onBack={() => navigation.goBack()} rightIcon="calendar-outline" />

      <View className="px-5 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              className={`mr-2 rounded-full px-4 py-2 ${filter === item ? 'bg-primary' : 'bg-slate-100'}`}
              onPress={() => setFilter(item)}
            >
              <Text className={`text-xs font-bold ${filter === item ? 'text-white' : 'text-slate-500'}`}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 104 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {filtered.length === 0 ? (
          <View className="px-5 pt-6">
            <EmptyState icon="notifications-outline" title="Belum ada notifikasi" />
          </View>
        ) : (
          filtered.map((notif: any) => (
            <TouchableOpacity
              key={notif.id}
              className="mx-5 flex-row items-start border-b border-slate-100 py-4"
              onPress={() => notif.eventId && navigation.getParent()?.navigate('EventSaya', { screen: 'DetailEventClient', params: { eventId: notif.eventId } })}
            >
              <View className={`mr-4 h-11 w-11 items-center justify-center rounded-xl ${notif.iconBg}`}>
                <Ionicons name={notif.icon as any} size={20} color={notif.iconColor} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-primary">{notif.title}</Text>
                <Text className="mt-1 text-xs leading-5 text-slate-500">{notif.desc}</Text>
                <Text className="mt-1.5 text-[10px] text-slate-400">{notif.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
