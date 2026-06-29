import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

let toastListener: ((options: ToastOptions) => void) | null = null;

export const Toast = {
  show: (options: ToastOptions) => {
    if (toastListener) {
      toastListener(options);
    }
  },
};

export const PremiumToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<ToastOptions | null>(null);
  const [translateY] = useState(new Animated.Value(-100));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    toastListener = (options) => {
      setConfig({ type: 'info', duration: 3000, ...options });
      
      // Haptic feedback based on type
      if (options.type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else if (options.type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      // Slide in
      Animated.spring(translateY, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto dismiss
      const duration = options.duration || 3000;
      setTimeout(() => {
        closeToast();
      }, duration);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const closeToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setConfig(null);
    });
  };

  const getTheme = (type?: ToastType) => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' };
      case 'error':
        return { icon: 'close-circle', color: '#EF4444', bg: '#FEF2F2' };
      default:
        return { icon: 'information-circle', color: '#3B82F6', bg: '#EFF6FF' };
    }
  };

  return (
    <>
      {children}
      {config && (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.toastContent, { backgroundColor: getTheme(config.type).bg }]}>
            <Ionicons name={getTheme(config.type).icon as any} size={24} color={getTheme(config.type).color} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{config.title}</Text>
              {config.message && <Text style={styles.message}>{config.message}</Text>}
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  message: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
});
