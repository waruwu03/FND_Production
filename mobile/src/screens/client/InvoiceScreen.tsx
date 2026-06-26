import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { EmptyState, FndHeader, StatusBadge } from '../../components/FndUi';
import { formatCurrency, formatDate } from '../../utils/fnd';

const TABS = ['Belum Lunas', 'Lunas'];

export const InvoiceScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Belum Lunas');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/events');
      if (response.data?.success) {
        const baseEvents = response.data.data || [];
        const details = await Promise.all(
          baseEvents.map((event: any) =>
            api.get(`/events/${event.id}`).then((res) => res.data?.data || event).catch(() => event),
          ),
        );
        setEvents(details);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal memuat invoice');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices(true);
    setRefreshing(false);
  };

  const invoices = useMemo(() => {
    return events.map((event) => {
      const total = Number(event.total_amount || 0);
      const paid = Number(event.paid_amount || 0);
      const payment = (event.payments || []).find((item: any) => item.status !== 'paid') || event.payments?.[0];
      const isPaid = total > 0 && paid >= total;
      return {
        id: `INV-${String(event.id).padStart(5, '0')}`,
        eventId: event.id,
        eventName: event.name,
        date: event.event_date,
        amount: total,
        paid,
        status: isPaid ? 'Lunas' : 'Belum Lunas',
        paymentId: payment?.id,
        paymentStatus: payment?.status,
      };
    }).filter((invoice) => invoice.status === activeTab);
  }, [events, activeTab]);

  const uploadProof = async (invoice: any) => {
    if (!invoice.paymentId) {
      Alert.alert('Invoice belum siap', 'Admin belum membuat item pembayaran untuk event ini. Invoice tetap tercatat dari total estimasi event.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan akses galeri untuk memilih bukti pembayaran.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('proof', {
      uri: asset.uri,
      name: asset.fileName || `payment-proof-${invoice.paymentId}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    } as any);

    setUploadingId(invoice.id);
    try {
      const response = await api.post(`/payments/${invoice.paymentId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.data?.success) throw new Error(response.data?.error || 'Upload gagal');
      Alert.alert('Berhasil', 'Bukti pembayaran berhasil diunggah. Admin akan melakukan verifikasi.');
      await fetchInvoices(true);
    } catch (error: any) {
      Alert.alert('Upload Gagal', error.response?.data?.error || error.message || 'Terjadi kesalahan');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FndHeader title="Invoice" onBack={() => navigation.getParent()?.navigate('Beranda')} />

      <View className="flex-row px-5 pb-4">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-2 flex-1 items-center rounded-full py-3 ${activeTab === tab ? 'bg-primary' : 'bg-slate-50'}`}
          >
            <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 104 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {invoices.length === 0 ? (
          <EmptyState icon="receipt-outline" title="Tidak ada invoice" description="Invoice akan muncul setelah ada event booking." />
        ) : (
          invoices.map((invoice) => {
            const paid = invoice.status === 'Lunas';
            return (
              <View
                key={invoice.id}
                className="mb-4 rounded-[24px] border border-slate-100 bg-white p-4"
                style={{ elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
              >
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-bold text-primary">Invoice #{invoice.id}</Text>
                    <Text className="mt-1 text-xs text-slate-500">{invoice.eventName}</Text>
                    <Text className="mt-1 text-xs text-slate-400">{formatDate(invoice.date)}</Text>
                  </View>
                  <StatusBadge label={invoice.status} bg={paid ? 'bg-emerald-100' : 'bg-red-100'} text={paid ? 'text-emerald-700' : 'text-red-600'} />
                </View>

                <View className="mb-4 flex-row justify-between">
                  <View>
                    <Text className="text-xs text-slate-400">{paid ? 'Lunas' : 'Belum Lunas'}</Text>
                    <Text className="font-black text-primary">{formatCurrency(invoice.amount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-slate-400">Terbayar</Text>
                    <Text className="font-bold text-primary">{formatCurrency(invoice.paid)}</Text>
                  </View>
                </View>

                <View className="flex-row">
                  <TouchableOpacity
                    className="mr-3 flex-1 items-center rounded-md bg-slate-50 py-3"
                    onPress={() => navigation.getParent()?.navigate('EventSaya', { screen: 'DetailEventClient', params: { eventId: invoice.eventId } })}
                  >
                    <Text className="font-bold text-primary">Lihat Invoice</Text>
                  </TouchableOpacity>
                  {paid ? (
                    <TouchableOpacity className="w-24 items-center rounded-md bg-slate-50 py-3">
                      <Ionicons name="download-outline" size={18} color="#0B1241" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity className="w-24 items-center rounded-md bg-primary py-3" onPress={() => uploadProof(invoice)} disabled={uploadingId === invoice.id}>
                      <Text className="font-bold text-white">{uploadingId === invoice.id ? '...' : 'Bayar'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
