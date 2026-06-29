import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api, getAssetUrl } from '../../services/api';
import { ConfirmDialog, EmptyState, FndHeader, PremiumModal, ProgressBar, StatusBadge } from '../../components/FndUi';
import { formatDate, getEventImage, getEventStatusMeta, getLocationParts } from '../../utils/fnd';

const TABS = ['Semua', 'On Going', 'Selesai', 'Dibatalkan'];

// ─── Edit Form State ─────────────────────────────────────────────────────────
type EditForm = { name: string; location: string; notes: string };

export const EventSayaScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Semua');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cancel state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedEventIdToCancel, setSelectedEventIdToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', location: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/events');
      if (response.data?.success) {
        setEvents(response.data.data || []);
      } else {
        throw new Error(response.data?.error || 'Gagal memuat event');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal mengambil data event');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(true);
    setRefreshing(false);
  };

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const confirmCancel = (eventId: number) => {
    setSelectedEventIdToCancel(eventId);
    setCancelModalVisible(true);
  };

  const executeCancel = async () => {
    if (!selectedEventIdToCancel) return;
    setIsCancelling(true);
    try {
      await api.delete(`/events/${selectedEventIdToCancel}`);
      await fetchEvents(true);
      setCancelModalVisible(false);
      setSelectedEventIdToCancel(null);
    } catch (error: any) {
      Alert.alert('Gagal Membatalkan', error.response?.data?.error || error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (event: any) => {
    setSelectedEventToEdit(event);
    setEditForm({
      name: event.name || '',
      location: event.location || '',
      notes: event.notes || '',
    });
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Nama wajib diisi', 'Nama event tidak boleh kosong.');
      return;
    }
    if (!editForm.location.trim()) {
      Alert.alert('Lokasi wajib diisi', 'Lokasi event tidak boleh kosong.');
      return;
    }
    setIsSaving(true);
    try {
      await api.put(`/events/${selectedEventToEdit.id}`, {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        notes: editForm.notes.trim(),
      });
      await fetchEvents(true);
      setEditModalVisible(false);
      setSelectedEventToEdit(null);
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.response?.data?.error || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = events.filter((event) => {
    if (activeTab === 'Semua') return true;
    return getEventStatusMeta(event.status).eventTab === activeTab;
  });

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FndHeader title="Event Saya" onBack={() => navigation.getParent()?.navigate('Beranda')} />

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 58 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Event List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 104 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Belum ada event"
            description="Booking baru akan muncul di sini setelah berhasil dikirim."
          />
        ) : (
          filtered.map((event) => {
            const status = getEventStatusMeta(event.status);
            const location = getLocationParts(event);
            const image = getAssetUrl(getEventImage(event)) || getEventImage(event);
            const canEdit = event.status === 'pending' || event.status === 'survey';

            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('DetailEventClient', { eventId: event.id })}
              >
                <Image source={{ uri: image }} style={styles.eventImage} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  {/* Title + Badge */}
                  <View style={styles.cardRow}>
                    <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
                    <StatusBadge label={status.clientLabel} bg={status.bg} text={status.text} />
                  </View>
                  {/* Date */}
                  <View style={styles.iconRow}>
                    <Ionicons name="calendar-outline" size={12} color="#64748B" />
                    <Text style={styles.iconRowText}>{formatDate(event.event_date)}</Text>
                  </View>
                  {/* Location */}
                  <View style={styles.iconRow}>
                    <Ionicons name="location-outline" size={12} color="#64748B" />
                    <Text style={[styles.iconRowText, { flex: 1 }]} numberOfLines={1}>{location.venue}</Text>
                  </View>
                  {/* Progress */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar progress={status.progress} />
                    </View>
                    <Text style={styles.progressText}>{status.progress}%</Text>
                  </View>

                  {/* Action Buttons */}
                  {canEdit && (
                    <View style={styles.actionRow}>
                      {/* Edit Button */}
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openEdit(event)}
                      >
                        <Ionicons name="pencil-outline" size={13} color="#F97316" />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      {/* Cancel Button */}
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => confirmCancel(event.id)}
                      >
                        <Ionicons name="close-circle-outline" size={13} color="#EF4444" />
                        <Text style={styles.cancelBtnText}>Batalkan</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── Premium Cancel Dialog ───────────────────────────────────────────── */}
      <ConfirmDialog
        visible={cancelModalVisible}
        onClose={() => !isCancelling && setCancelModalVisible(false)}
        onConfirm={executeCancel}
        loading={isCancelling}
        icon="trash-outline"
        iconBg="#FEF2F2"
        iconColor="#EF4444"
        title="Batalkan Pesanan?"
        description="Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        confirmBg="#EF4444"
        cancelLabel="Kembali"
      />

      {/* ── Premium Edit Modal ──────────────────────────────────────────────── */}
      <PremiumModal
        visible={editModalVisible}
        onClose={() => !isSaving && setEditModalVisible(false)}
        title="Edit Booking"
        maxHeight="80%"
      >
        <ScrollView
          style={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.editInfoBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#F97316" />
            <Text style={styles.editInfoText}>
              Anda dapat mengubah nama, lokasi, dan catatan selama booking masih menunggu konfirmasi.
            </Text>
          </View>

          {/* Name */}
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Nama Event</Text>
            <TextInput
              value={editForm.name}
              onChangeText={(v) => setEditForm({ ...editForm, name: v })}
              placeholder="Nama event Anda"
              placeholderTextColor="#94A3B8"
              style={styles.editInput}
            />
          </View>

          {/* Location */}
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Lokasi Event</Text>
            <TextInput
              value={editForm.location}
              onChangeText={(v) => setEditForm({ ...editForm, location: v })}
              placeholder="Nama gedung / tempat"
              placeholderTextColor="#94A3B8"
              style={styles.editInput}
            />
          </View>

          {/* Notes */}
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Catatan Tambahan</Text>
            <TextInput
              value={editForm.notes}
              onChangeText={(v) => setEditForm({ ...editForm, notes: v })}
              placeholder="Kebutuhan khusus atau informasi lainnya..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              style={[styles.editInput, { minHeight: 90, paddingTop: 12 }]}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={saveEdit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </PremiumModal>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Tabs
  tabChip: {
    marginRight: 8, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: { backgroundColor: '#F97316' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },

  // Event Card
  eventCard: {
    flexDirection: 'row', marginBottom: 14,
    backgroundColor: '#FFFFFF', borderRadius: 22,
    borderWidth: 1, borderColor: '#F1F5F9',
    padding: 14, elevation: 2,
    shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  eventImage: { width: 78, height: 78, borderRadius: 16, marginRight: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  eventName: { fontSize: 13, fontWeight: '800', color: '#F97316', flex: 1, marginRight: 8 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  iconRowText: { marginLeft: 5, fontSize: 11, color: '#64748B' },
  progressText: { marginLeft: 8, fontSize: 11, fontWeight: '800', color: '#F97316' },

  // Action buttons
  actionRow: {
    flexDirection: 'row', marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    gap: 8,
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF7ED', borderRadius: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FED7AA', gap: 4,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#F97316' },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FECACA', gap: 4,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  // Edit Modal
  editInfoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12,
    marginBottom: 18, gap: 8,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  editInfoText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  editField: { marginBottom: 16 },
  editLabel: {
    fontSize: 11, fontWeight: '700', color: '#0B1241',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  editInput: {
    backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16,
    height: 50, fontSize: 14, color: '#0B1241',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F97316', borderRadius: 18, paddingVertical: 16,
    marginTop: 8, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
