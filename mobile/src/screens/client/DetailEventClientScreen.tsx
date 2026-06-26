import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Image, Linking, StyleSheet, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getAssetUrl } from '../../services/api';
import { ConfirmDialog, PremiumModal } from '../../components/FndUi';
import { formatCurrency, formatDate, getEventImage, getEventStatusMeta, getLocationParts } from '../../utils/fnd';

const STATUS_STEPS = ['Menunggu Konfirmasi', 'Persiapan', 'Crew Ditugaskan', 'Sedang Berlangsung', 'Selesai'];

export const DetailEventClientScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { eventId } = route.params || {};
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Cancel
  const [cancelVisible, setCancelVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', location: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await api.get(`/events/${eventId}`);
      if (response.data?.success) {
        setEvent(response.data.data);
      } else {
        throw new Error(response.data?.error || 'Gagal memuat detail event');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Gagal memuat event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvent(); }, [eventId]);

  if (loading || !event) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const status = getEventStatusMeta(event.status);
  const location = getLocationParts(event);
  const imageUrl = getAssetUrl(getEventImage(event)) || getEventImage(event);
  const total = Number(event.total_amount || 0);
  const paid = Number(event.paid_amount || 0);
  const remaining = Math.max(total - paid, 0);
  const canEdit = event.status === 'pending' || event.status === 'survey';

  const openEdit = () => {
    setEditForm({
      name: event.name || '',
      location: event.location || '',
      notes: event.notes || '',
    });
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) { Alert.alert('Nama wajib diisi', 'Nama event tidak boleh kosong.'); return; }
    if (!editForm.location.trim()) { Alert.alert('Lokasi wajib diisi', 'Lokasi event tidak boleh kosong.'); return; }
    setIsSaving(true);
    try {
      await api.put(`/events/${event.id}`, {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        notes: editForm.notes.trim(),
      });
      await fetchEvent();
      setEditVisible(false);
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.response?.data?.error || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const executeCancel = async () => {
    setIsCancelling(true);
    try {
      await api.delete(`/events/${event.id}`);
      setCancelVisible(false);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Gagal Membatalkan', error.response?.data?.error || error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const contactWhatsApp = () => {
    const phone = event.client_phone || '6281234567890';
    Linking.openURL(`https://wa.me/${String(phone).replace(/^0/, '62')}`).catch(() => {
      Alert.alert('Gagal', 'Tidak dapat membuka WhatsApp.');
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1241' }}>
      {/* Hero Image */}
      <View style={{ height: 260, position: 'relative' }}>
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,65,0.4)' }} />

        {/* Top Bar */}
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.heroBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Detail Event</Text>
          <View style={[styles.heroBadge, { backgroundColor: status.color + '33' }]}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{status.clientLabel}</Text>
          </View>
        </View>
      </View>

      {/* Content Card */}
      <View style={styles.contentCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: canEdit ? 140 : 110 }}
        >
          {/* Event Title */}
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color="#64748B" />
            <Text style={styles.infoText}>{formatDate(event.event_date)} | {event.start_time || '08:00'} WIB</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 24 }]}>
            <Ionicons name="location-outline" size={15} color="#64748B" style={{ marginTop: 1 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.infoVenue}>{location.venue}</Text>
              <Text style={styles.infoAddress}>{location.address}</Text>
            </View>
          </View>

          {/* Status Steps */}
          <Text style={styles.sectionLabel}>Status Event</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {STATUS_STEPS.map((step, index) => {
                const done = index < status.step || event.status === 'selesai';
                const active = index === status.step && event.status !== 'selesai';
                return (
                  <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[styles.stepDot, done ? styles.stepDotDone : active ? styles.stepDotActive : styles.stepDotIdle]}>
                        {done
                          ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          : active
                          ? <Ionicons name="ellipse" size={8} color="#10B981" />
                          : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />}
                      </View>
                      <Text style={[styles.stepLabel, (done || active) ? styles.stepLabelActive : styles.stepLabelIdle]}>
                        {step}
                      </Text>
                    </View>
                    {index < STATUS_STEPS.length - 1 ? (
                      <View style={[styles.stepConnector, done ? styles.stepConnectorDone : styles.stepConnectorIdle]} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Booking Info */}
          <Text style={styles.sectionLabel}>Informasi Booking</Text>
          <View style={styles.infoCard}>
            {[
              ['No. Booking', `FND-${String(event.id).padStart(6, '0')}`],
              ['Tanggal Booking', formatDate(event.created_at || event.event_date)],
              ['Total Estimasi', formatCurrency(total)],
              ['Terbayar', formatCurrency(paid)],
              ['Sisa Tagihan', formatCurrency(remaining)],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoCardRow}>
                <Text style={styles.infoCardLabel}>{label}</Text>
                <Text style={[styles.infoCardValue, label === 'Sisa Tagihan' && remaining > 0 && { color: '#EF4444' }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* Equipment */}
          {event.equipment?.length ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Layanan Dipilih</Text>
              <View style={styles.infoCard}>
                {event.equipment.map((item: any) => (
                  <View key={`${item.id}-${item.name}`} style={styles.infoCardRow}>
                    <Text style={styles.infoCardLabel}>{item.name}</Text>
                    <Text style={styles.infoCardValue}>×{item.quantity}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        {/* ── Bottom Action Bar ─────────────────────────────────────────────── */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {canEdit ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity style={styles.editActionBtn} onPress={openEdit}>
                <Ionicons name="pencil-outline" size={17} color="#F97316" />
                <Text style={styles.editActionText}>Edit Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelActionBtn} onPress={() => setCancelVisible(true)}>
                <Ionicons name="close-circle-outline" size={17} color="#EF4444" />
                <Text style={styles.cancelActionText}>Batalkan</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity style={styles.whatsappBtn} onPress={contactWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsappText}>Hubungi Admin via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Cancel Dialog ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        visible={cancelVisible}
        onClose={() => !isCancelling && setCancelVisible(false)}
        onConfirm={executeCancel}
        loading={isCancelling}
        icon="trash-outline"
        iconBg="#FEF2F2"
        iconColor="#EF4444"
        title="Batalkan Booking?"
        description="Apakah Anda yakin ingin membatalkan event ini? Tindakan ini tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        confirmBg="#EF4444"
        cancelLabel="Kembali"
      />

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <PremiumModal
        visible={editVisible}
        onClose={() => !isSaving && setEditVisible(false)}
        title="Edit Booking"
        maxHeight="80%"
      >
        <ScrollView
          style={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.editBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#F97316" />
            <Text style={styles.editBannerText}>
              Perubahan dapat dilakukan selama booking masih menunggu konfirmasi admin.
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
  // Hero
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },

  // Card
  contentCard: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },

  // Event info
  eventTitle: { fontSize: 22, fontWeight: '900', color: '#0B1241', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 13, color: '#475569' },
  infoVenue: { fontSize: 13, fontWeight: '700', color: '#0B1241' },
  infoAddress: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Section
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#0B1241', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Status steps
  stepDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: '#10B981' },
  stepDotActive: { backgroundColor: '#D1FAE5', borderWidth: 2, borderColor: '#10B981' },
  stepDotIdle: { backgroundColor: '#F1F5F9' },
  stepLabel: { marginTop: 6, width: 72, textAlign: 'center', fontSize: 10, lineHeight: 13 },
  stepLabelActive: { color: '#0B1241', fontWeight: '600' },
  stepLabelIdle: { color: '#94A3B8' },
  stepConnector: { height: 2, width: 28, marginTop: 17, borderRadius: 1 },
  stepConnectorDone: { backgroundColor: '#10B981' },
  stepConnectorIdle: { backgroundColor: '#E2E8F0' },

  // Info card
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  infoCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoCardLabel: { fontSize: 12, color: '#94A3B8' },
  infoCardValue: { fontSize: 12, fontWeight: '700', color: '#0B1241' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 10,
  },
  editActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF7ED', borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: '#FED7AA', gap: 6,
  },
  editActionText: { fontSize: 13, fontWeight: '700', color: '#F97316' },
  cancelActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: '#FECACA', gap: 6,
  },
  cancelActionText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', borderRadius: 18, paddingVertical: 15, gap: 8,
  },
  whatsappText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Edit Modal
  editBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12,
    marginBottom: 18, gap: 8, borderWidth: 1, borderColor: '#FED7AA',
  },
  editBannerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  editField: { marginBottom: 16 },
  editLabel: { fontSize: 11, fontWeight: '700', color: '#0B1241', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  editInput: {
    backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16,
    height: 50, fontSize: 14, color: '#0B1241', borderWidth: 1, borderColor: '#E2E8F0',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F97316', borderRadius: 18, paddingVertical: 16, marginTop: 8, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
