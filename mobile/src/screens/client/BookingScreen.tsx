import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, FndHeader, PremiumModal } from '../../components/FndUi';
import { buildServicesFromEquipment, formatCurrency, ServiceItem } from '../../utils/fnd';

// ─── Types ───────────────────────────────────────────────────────────────────
type BookingForm = {
  name: string;
  eventDate: string;
  startTime: string;
  location: string;
  guests: string;
  notes: string;
};

const emptyForm: BookingForm = {
  name: '',
  eventDate: '',
  startTime: '08:00',
  location: '',
  guests: '',
  notes: '',
};

// ─── Time Slots ───────────────────────────────────────────────────────────────
const TIME_GROUPS = [
  {
    label: '🌅 Pagi',
    slots: ['07:00', '08:00', '09:00', '10:00', '11:00'],
  },
  {
    label: '☀️ Siang',
    slots: ['12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  {
    label: '🌆 Malam',
    slots: ['17:00', '18:00', '19:00', '20:00', '21:00'],
  },
];

// ─── Premium Calendar Component ───────────────────────────────────────────────
const WEEK_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function CalendarPicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    d.setDate(d.getDate() + 1);
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return d.getMonth();
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const toStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const isPast = (day: number) => {
    const cellDate = new Date(viewYear, viewMonth, day);
    return cellDate <= today;
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Month nav */}
      <View style={styles.calMonthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={20} color="#0B1241" />
        </TouchableOpacity>
        <Text style={styles.calMonthLabel}>
          {MONTHS_ID[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={20} color="#0B1241" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.calWeekRow}>
        {WEEK_DAYS.map(d => (
          <Text key={d} style={[styles.calWeekLabel, d === 'Min' && { color: '#EF4444' }]}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={styles.calCell} />;

          const str = toStr(day);
          const isSelected = str === selectedDate;
          const past = isPast(day);
          const isSun = (firstDay + day - 1) % 7 === 0;

          return (
            <TouchableOpacity
              key={str}
              style={[
                styles.calCell,
                styles.calDayBtn,
                isSelected && styles.calDaySelected,
                past && styles.calDayPast,
              ]}
              onPress={() => !past && onSelect(str)}
              disabled={past}
            >
              <Text
                style={[
                  styles.calDayText,
                  isSelected && styles.calDayTextSelected,
                  past && styles.calDayTextPast,
                  !isSelected && !past && isSun && { color: '#EF4444' },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const BookingScreen = ({ route, navigation }: any) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selected, setSelected] = useState<Record<string, { service: ServiceItem; qty: number }>>({});
  const [formData, setFormData] = useState<BookingForm>(emptyForm);
  const [references, setReferences] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<any>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Step progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (step - 1) / 3,
      useNativeDriver: false,
      damping: 18,
      stiffness: 180,
    }).start();
  }, [step]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setStep((currentStep) => {
        if (currentStep === 4) {
          setFormData(emptyForm);
          setSelected({});
          setReferences([]);
          return 1;
        }
        return currentStep;
      });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/equipment');
        const nextServices = buildServicesFromEquipment(response.data?.data || []);
        setServices(nextServices);
        const routeService = route?.params?.selectedService as ServiceItem | undefined;
        const initial = routeService || nextServices[0];
        if (initial) setSelected({ [initial.id]: { service: initial, qty: 1 } });
      } catch {
        const fallback = buildServicesFromEquipment([]);
        setServices(fallback);
        setSelected({ [fallback[0].id]: { service: fallback[0], qty: 1 } });
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const routeService = route?.params?.selectedService as ServiceItem | undefined;
    if (!routeService) return;
    setSelected((prev) => ({
      ...prev,
      [routeService.id]: { service: routeService, qty: prev[routeService.id]?.qty || 1 },
    }));
  }, [route?.params?.selectedService?.id]);

  const selectedItems = Object.values(selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.service.price * item.qty, 0);
  const discount = subtotal >= 10000000 ? 500000 : 0;
  const totalAmount = Math.max(subtotal - discount, 0);

  const updateQty = (service: ServiceItem, delta: number) => {
    setSelected((prev) => {
      const current = prev[service.id]?.qty || 0;
      const nextQty = Math.max(0, current + delta);
      const next = { ...prev };
      if (nextQty === 0) delete next[service.id];
      else next[service.id] = { service, qty: nextQty };
      return next;
    });
  };

  const validateDetail = () => {
    if (!formData.name.trim()) return 'Nama event wajib diisi.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.eventDate)) return 'Tanggal event belum dipilih.';
    if (!formData.location.trim()) return 'Lokasi event wajib diisi.';
    return null;
  };

  const pickReference = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan akses galeri untuk memilih referensi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.75,
    });
    if (!result.canceled) setReferences(result.assets.slice(0, 4));
  };

  const uploadReferences = async () => {
    if (!references.length) return [];
    const formDataUpload = new FormData();
    references.forEach((asset, index) => {
      formDataUpload.append('images', {
        uri: asset.uri,
        name: asset.fileName || `reference-${Date.now()}-${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);
    });
    const response = await api.post('/uploads/images', formDataUpload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (response.data?.data || []).map((item: any) => item.url).filter(Boolean);
  };

  const submitBooking = async () => {
    const validationError = validateDetail();
    if (validationError) { Alert.alert('Data belum lengkap', validationError); setStep(2); return; }
    if (!selectedItems.length) { Alert.alert('Pilih layanan', 'Pilih minimal satu layanan untuk booking.'); setStep(1); return; }

    setIsSubmitting(true);
    try {
      const referenceImages = await uploadReferences();
      const serviceSummary = selectedItems.map((item) => `${item.service.name} x${item.qty}`).join(', ');
      const notes = [
        formData.notes.trim(),
        formData.guests ? `Estimasi tamu: ${formData.guests}` : '',
        `Layanan dipilih: ${serviceSummary}`,
        `Jam mulai: ${formData.startTime}`,
      ].filter(Boolean).join('\n');

      const response = await api.post('/events', {
        name: formData.name.trim(),
        type: selectedItems[0].service.category,
        eventDate: formData.eventDate,
        location: formData.location.trim(),
        notes,
        totalAmount,
        dpAmount: 0,
        referenceImages,
        equipment: selectedItems
          .filter((item) => item.service.equipmentId)
          .map((item) => ({ equipmentId: item.service.equipmentId, quantity: item.qty })),
        crew: [],
      });

      if (!response.data?.success) throw new Error(response.data?.error || 'Booking gagal');

      setCreatedEvent({
        id: response.data.data?.eventId,
        name: formData.name.trim(),
        date: formData.eventDate,
        total: totalAmount,
      });
      setStep(4);
      setFormData(emptyForm);
      setReferences([]);
    } catch (error: any) {
      Alert.alert('Booking Gagal', error.response?.data?.error || error.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1 && !selectedItems.length) { Alert.alert('Pilih layanan', 'Pilih minimal satu layanan.'); return false; }
    if (step === 2) {
      const err = validateDetail();
      if (err) { Alert.alert('Data belum lengkap', err); return false; }
    }
    return true;
  };

  const nextStep = () => { if (!canGoNext()) return; setStep((c) => Math.min(c + 1, 3)); };
  const stepLabels = ['Layanan', 'Detail', 'Ringkasan', 'Selesai'];

  // ── Stepper ────────────────────────────────────────────────────────────────
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {stepLabels.map((label, index) => {
        const number = index + 1;
        const done = step > number;
        const active = step === number;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepRow}>
              <View style={styles.stepLine}>
                {index > 0 ? (
                  <View style={[styles.stepLineBar, step > index ? styles.stepLineDone : styles.stepLineIdle]} />
                ) : null}
              </View>
              <View style={[styles.stepCircle, done ? styles.stepCircleDone : active ? styles.stepCircleActive : styles.stepCircleIdle]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  : <Text style={[styles.stepNumber, active ? styles.stepNumberActive : styles.stepNumberIdle]}>{number}</Text>}
              </View>
              <View style={styles.stepLine}>
                {index < stepLabels.length - 1 ? (
                  <View style={[styles.stepLineBar, step > number ? styles.stepLineDone : styles.stepLineIdle]} />
                ) : null}
              </View>
            </View>
            <Text style={[styles.stepLabel, active ? styles.stepLabelActive : done ? styles.stepLabelDone : styles.stepLabelIdle]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // ── Step 1 — Services ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>Pilih Layanan</Text>
      {loadingServices ? (
        <ActivityIndicator size="large" color="#F97316" />
      ) : services.length === 0 ? (
        <EmptyState icon="construct-outline" title="Layanan belum tersedia" />
      ) : (
        services.slice(0, 8).map((service) => {
          const qty = selected[service.id]?.qty || 0;
          return (
            <View key={service.id} style={styles.serviceCard}>
              <Image source={{ uri: getAssetUrl(service.image) || service.image }} style={styles.serviceImage} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(service, -1)}>
                  <Ionicons name="remove" size={16} color={qty > 0 ? '#0F172A' : '#CBD5E1'} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => updateQty(service, 1)}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
      <TouchableOpacity style={styles.addMoreBtn} onPress={() => navigation.navigate('Layanan')}>
        <Ionicons name="add-circle-outline" size={20} color="#F97316" />
        <Text style={styles.addMoreText}>Tambah Layanan Lain</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Input Helper ────────────────────────────────────────────────────────────
  const renderInput = (label: string, value: string, onChange: (v: string) => void, placeholder: string, multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.textInput, multiline && styles.textInputMulti]}
      />
    </View>
  );

  // ── Step 2 — Detail ─────────────────────────────────────────────────────────
  const displayDate = useMemo(() => {
    if (!formData.eventDate) return null;
    const d = new Date(formData.eventDate + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [formData.eventDate]);

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Detail Event</Text>
      {renderInput('Nama Event', formData.name, (v) => setFormData({ ...formData, name: v }), 'Wedding Andi & Sinta')}

      {/* Date & Time Row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Date Picker Trigger */}
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Tanggal Event</Text>
          <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowDatePicker(true)}>
            <View style={{ flex: 1 }}>
              {displayDate ? (
                <>
                  <Text style={styles.pickerValueMain} numberOfLines={1}>
                    {displayDate.split(',')[1]?.trim() || displayDate}
                  </Text>
                  <Text style={styles.pickerValueSub}>
                    {displayDate.split(',')[0]}
                  </Text>
                </>
              ) : (
                <Text style={styles.pickerPlaceholder}>Pilih Tanggal</Text>
              )}
            </View>
            <View style={styles.pickerIcon}>
              <Ionicons name="calendar" size={16} color="#F97316" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Time Picker Trigger */}
        <View style={{ flex: 0.7 }}>
          <Text style={styles.inputLabel}>Jam Mulai</Text>
          <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowTimePicker(true)}>
            <View style={{ flex: 1 }}>
              <Text style={formData.startTime ? styles.pickerValueMain : styles.pickerPlaceholder}>
                {formData.startTime || 'Pilih Jam'}
              </Text>
              {formData.startTime ? (
                <Text style={styles.pickerValueSub}>WIB</Text>
              ) : null}
            </View>
            <View style={styles.pickerIcon}>
              <Ionicons name="time" size={16} color="#F97316" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Modal */}
      <PremiumModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        title="Pilih Tanggal Event"
        maxHeight="82%"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
          <CalendarPicker
            selectedDate={formData.eventDate}
            onSelect={(str) => {
              setFormData({ ...formData, eventDate: str });
              setShowDatePicker(false);
            }}
          />
        </ScrollView>
      </PremiumModal>

      {/* Time Modal */}
      <PremiumModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        title="Pilih Jam Mulai"
        maxHeight="65%"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {TIME_GROUPS.map((group) => (
            <View key={group.label} style={{ marginBottom: 16 }}>
              <Text style={styles.timeGroupLabel}>{group.label}</Text>
              <View style={styles.timeGrid}>
                {group.slots.map((t) => {
                  const active = formData.startTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeSlot, active && styles.timeSlotActive]}
                      onPress={() => { setFormData({ ...formData, startTime: t }); setShowTimePicker(false); }}
                    >
                      <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      </PremiumModal>

      {renderInput('Lokasi Event', formData.location, (v) => setFormData({ ...formData, location: v }), 'Gedung Graha Sarana')}
      {renderInput('Jumlah Tamu (Estimasi)', formData.guests, (v) => setFormData({ ...formData, guests: v.replace(/[^\d]/g, '') }), '500 Orang')}
      {renderInput('Catatan Tambahan', formData.notes, (v) => setFormData({ ...formData, notes: v }), 'Tuliskan kebutuhan khusus Anda di sini...', true)}

      <Text style={styles.inputLabel}>Upload Referensi (Opsional)</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickReference}>
        <View style={styles.uploadIcon}>
          <Ionicons name="image-outline" size={20} color="#F97316" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadLabel}>Tambah Foto Referensi</Text>
          <Text style={styles.uploadSub}>PNG, JPG — maks. 4 foto</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>
      {references.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {references.map((asset) => (
            <Image key={asset.uri} source={{ uri: asset.uri }} style={styles.refThumb} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  // ── Step 3 — Summary ────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>Ringkasan Booking</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryEventName}>{formData.name || '-'}</Text>
        {[
          { icon: 'calendar-outline', text: displayDate || formData.eventDate || '-' },
          { icon: 'time-outline', text: `${formData.startTime} WIB` },
          { icon: 'location-outline', text: formData.location || '-' },
          { icon: 'people-outline', text: `Estimasi ${formData.guests || '0'} Tamu` },
        ].map(({ icon, text }) => (
          <View key={icon} style={styles.summaryRow}>
            <Ionicons name={icon as any} size={15} color="#64748B" />
            <Text style={styles.summaryRowText}>{text}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.inputLabel, { marginTop: 4, marginBottom: 8 }]}>Layanan Dipilih</Text>
      {selectedItems.map((item) => (
        <View key={item.service.id} style={styles.lineItem}>
          <Text style={styles.lineItemLabel}>{item.service.name} ×{item.qty}</Text>
          <Text style={styles.lineItemValue}>{formatCurrency(item.service.price * item.qty)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.lineItem}>
        <Text style={styles.lineItemLabel}>Subtotal</Text>
        <Text style={styles.lineItemValue}>{formatCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View style={styles.lineItem}>
          <Text style={[styles.lineItemLabel, { color: '#10B981' }]}>Diskon</Text>
          <Text style={[styles.lineItemValue, { color: '#10B981' }]}>- {formatCurrency(discount)}</Text>
        </View>
      )}
      <View style={[styles.lineItem, { marginTop: 8 }]}>
        <Text style={styles.totalLabel}>Total Estimasi</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
      </View>
    </View>
  );

  // ── Step 4 — Success ────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <View style={{ alignItems: 'center', paddingTop: 24 }}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.successTitle}>Booking Berhasil! 🎉</Text>
      <Text style={styles.successSub}>
        Tim kami akan segera memproses dan menghubungi Anda untuk konfirmasi.
      </Text>
      <View style={styles.receiptCard}>
        <Text style={styles.receiptName}>{createdEvent?.name || 'Booking Event'}</Text>
        {[
          ['No. Booking', `FND-${String(createdEvent?.id || 'NEW').padStart(6, '0')}`],
          ['Tanggal Event', createdEvent?.date || '-'],
          ['Total Estimasi', formatCurrency(createdEvent?.total || 0)],
          ['Status', 'Menunggu Konfirmasi'],
        ].map(([label, value]) => (
          <View key={label} style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>{label}</Text>
            <Text style={styles.receiptValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FndHeader
        title={step === 4 ? 'Booking Berhasil' : 'Booking Event'}
        onBack={() => (step > 1 && step < 4 ? setStep(step - 1) : navigation.goBack())}
      />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: step === 4 ? 70 : 160 }}
      >
        {renderStepper()}
        {step === 1 ? renderStep1() : null}
        {step === 2 ? renderStep2() : null}
        {step === 3 ? renderStep3() : null}
        {step === 4 ? renderStep4() : null}
      </ScrollView>

      {/* Bottom Bar */}
      {step < 4 ? (
        <View style={styles.bottomBar}>
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.bottomEstLabel}>Total Estimasi</Text>
            <Text style={styles.bottomEstValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.ctaBtn, isSubmitting && { opacity: 0.7 }]}
            disabled={isSubmitting}
            onPress={step === 3 ? submitBooking : nextStep}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaBtnText}>
                {step === 3 ? 'Kirim Booking' : 'Lanjutkan'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, { marginBottom: 8 }]}
            onPress={() => navigation.getParent()?.navigate('EventSaya')}
          >
            <Text style={styles.ctaBtnText}>Lihat Event Saya</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.getParent()?.navigate('Beranda')}
          >
            <Text style={styles.ghostBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Stepper
  stepperContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  stepItem: { flex: 1, alignItems: 'center' },
  stepRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  stepLine: { flex: 1 },
  stepLineBar: { height: 2, borderRadius: 1 },
  stepLineDone: { backgroundColor: '#10B981' },
  stepLineIdle: { backgroundColor: '#E2E8F0' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { backgroundColor: '#10B981' },
  stepCircleActive: { backgroundColor: '#F97316' },
  stepCircleIdle: { backgroundColor: '#E2E8F0' },
  stepNumber: { fontSize: 12, fontWeight: '800' },
  stepNumberActive: { color: '#FFFFFF' },
  stepNumberIdle: { color: '#94A3B8' },
  stepLabel: { marginTop: 6, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: '#F97316' },
  stepLabelDone: { color: '#10B981' },
  stepLabelIdle: { color: '#94A3B8' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0B1241', marginBottom: 16 },

  // Service card
  serviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    padding: 12, marginBottom: 12,
    elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8,
  },
  serviceImage: { width: 60, height: 60, borderRadius: 14, marginRight: 12 },
  serviceName: { fontSize: 14, fontWeight: '700', color: '#0B1241' },
  servicePrice: { fontSize: 12, color: '#F97316', fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: '#F97316' },
  qtyText: { width: 28, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#0B1241' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', borderRadius: 14, paddingVertical: 14, marginTop: 4, gap: 8 },
  addMoreText: { color: '#F97316', fontWeight: '700', fontSize: 14 },

  // Input
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#0B1241', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 14, color: '#0B1241', borderWidth: 1, borderColor: '#E2E8F0' },
  textInputMulti: { minHeight: 96, paddingTop: 14 },

  // Picker trigger
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 14, minHeight: 56,
  },
  pickerValueMain: { fontSize: 14, fontWeight: '700', color: '#0B1241' },
  pickerValueSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  pickerPlaceholder: { fontSize: 14, color: '#94A3B8' },
  pickerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },

  // Calendar
  calendarContainer: { paddingTop: 8, paddingBottom: 16 },
  calMonthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNavBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  calMonthLabel: { fontSize: 16, fontWeight: '800', color: '#0B1241' },
  calWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calDayBtn: {},
  calDaySelected: { backgroundColor: '#F97316', borderRadius: 12 },
  calDayPast: { opacity: 0.3 },
  calDayText: { fontSize: 14, fontWeight: '600', color: '#0B1241' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  calDayTextPast: { color: '#CBD5E1' },

  // Time
  timeGroupLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  timeSlotActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  timeSlotText: { fontSize: 14, fontWeight: '700', color: '#0B1241' },
  timeSlotTextActive: { color: '#FFFFFF' },

  // Upload
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#FED7AA', gap: 12 },
  uploadIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { fontSize: 14, fontWeight: '700', color: '#0B1241' },
  uploadSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  refThumb: { width: 64, height: 64, borderRadius: 10, marginRight: 8 },

  // Summary
  summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryEventName: { fontSize: 17, fontWeight: '900', color: '#0B1241', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  summaryRowText: { fontSize: 13, color: '#475569', flex: 1 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lineItemLabel: { fontSize: 13, color: '#64748B' },
  lineItemValue: { fontSize: 13, fontWeight: '600', color: '#0B1241' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#0B1241' },
  totalValue: { fontSize: 15, fontWeight: '900', color: '#F97316' },

  // Step 4
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#0B1241', marginBottom: 8 },
  successSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 16 },
  receiptCard: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  receiptName: { fontSize: 16, fontWeight: '900', color: '#0B1241', marginBottom: 14 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  receiptLabel: { fontSize: 12, color: '#94A3B8' },
  receiptValue: { fontSize: 12, fontWeight: '700', color: '#0B1241' },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 10 },
  bottomEstLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  bottomEstValue: { fontSize: 22, fontWeight: '900', color: '#0B1241' },
  ctaBtn: { backgroundColor: '#F97316', borderRadius: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { fontSize: 14, fontWeight: '700', color: '#0B1241' },
});
