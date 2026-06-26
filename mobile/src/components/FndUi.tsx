import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof Ionicons.glyphMap;

type HeaderProps = {
  title: string;
  dark?: boolean;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
};

export function FndHeader({ title, dark = false, onBack, rightIcon, onRightPress }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const iconColor = dark ? '#FFFFFF' : '#0B1241';

  return (
    <View style={{ paddingTop: insets.top + 10 }} className={`${dark ? 'bg-primary' : 'bg-white'} px-5 pb-4`}>
      <View className="h-11 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          {onBack ? <Ionicons name="chevron-back" size={24} color={iconColor} /> : null}
        </TouchableOpacity>
        <Text className={`${dark ? 'text-white' : 'text-primary'} text-base font-bold`}>{title}</Text>
        <TouchableOpacity
          onPress={onRightPress}
          disabled={!rightIcon}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          {rightIcon ? <Ionicons name={rightIcon} size={22} color={iconColor} /> : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function StatusBadge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <View className={`${bg} rounded-md px-3 py-1.5`}>
      <Text className={`${text} text-[10px] font-bold`}>{label}</Text>
    </View>
  );
}

export function InfoRow({
  icon,
  title,
  subtitle,
  dense = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  dense?: boolean;
}) {
  return (
    <View className={`flex-row items-start ${dense ? 'mb-1.5' : 'mb-3'}`}>
      <Ionicons name={icon} size={dense ? 14 : 18} color="#64748B" style={{ marginTop: dense ? 1 : 2 }} />
      <View className="ml-2 flex-1">
        <Text className={`${dense ? 'text-xs' : 'text-sm'} font-medium text-primary`} numberOfLines={dense ? 1 : 2}>
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function ProgressBar({ progress, color = '#2563EB' }: { progress: number; color?: string }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View className="h-full rounded-full" style={{ width: `${safeProgress}%`, backgroundColor: color }} />
    </View>
  );
}

export function EmptyState({ icon, title, description }: { icon: IconName; title: string; description?: string }) {
  return (
    <View className="items-center rounded-2xl border border-slate-100 bg-slate-50 p-6">
      <Ionicons name={icon} size={40} color="#CBD5E1" />
      <Text className="mt-3 text-center font-bold text-primary">{title}</Text>
      {description ? <Text className="mt-1 text-center text-xs leading-5 text-slate-500">{description}</Text> : null}
    </View>
  );
}

export function LoadingState({ dark = false }: { dark?: boolean }) {
  return (
    <View className={`${dark ? 'bg-primary' : 'bg-white'} flex-1 items-center justify-center`}>
      <ActivityIndicator size="large" color={dark ? '#FFFFFF' : '#2563EB'} />
    </View>
  );
}

// ─── Premium Bottom Sheet Modal ────────────────────────────────────────────────
type PremiumModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: string;
};

export function PremiumModal({ visible, onClose, title, children, maxHeight = '75%' }: PremiumModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)', opacity: fadeAnim }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            {
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: maxHeight as any,
              paddingBottom: 28,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#CBD5E1',
              }}
            />
          </View>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0B1241' }}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Premium Confirm Dialog ────────────────────────────────────────────────────
type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  icon?: IconName;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmBg?: string;
  cancelLabel?: string;
};

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  loading = false,
  icon = 'warning',
  iconBg = '#FEF2F2',
  iconColor = '#EF4444',
  title,
  description,
  confirmLabel = 'Konfirmasi',
  confirmBg = '#EF4444',
  cancelLabel = 'Kembali',
}: ConfirmDialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => !loading && onClose()}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          backgroundColor: 'rgba(15,23,42,0.65)',
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 28,
            padding: 28,
            alignItems: 'center',
            transform: [{ scale: scaleAnim }],
            shadowColor: '#0F172A',
            shadowOpacity: 0.15,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 10 },
            elevation: 20,
          }}
        >
          {/* Icon Circle */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name={icon} size={34} color={iconColor} />
          </View>

          <Text style={{ fontSize: 19, fontWeight: '900', color: '#0B1241', marginBottom: 8, textAlign: 'center' }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
            {description}
          </Text>

          {/* Divider */}
          <View style={{ width: '100%', height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
              }}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: confirmBg,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
