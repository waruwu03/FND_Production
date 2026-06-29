import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

let alertListener: ((options: AlertOptions) => void) | null = null;

export const PremiumAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (alertListener) {
      alertListener({ title, message, buttons });
    } else {
      // Fallback
      import('react-native').then(({ Alert }) => Alert.alert(title, message, buttons));
    }
  }
};

export const PremiumAlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    alertListener = (options) => {
      setConfig(options);
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    };

    return () => {
      alertListener = null;
    };
  }, [fadeAnim, scaleAnim]);

  const closeAlert = (onPress?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      if (onPress) onPress();
    });
  };

  const getIconName = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('error') || lowerTitle.includes('gagal') || lowerTitle.includes('ditolak')) {
      return { name: 'close-circle', color: '#EF4444' };
    }
    if (lowerTitle.includes('sukses') || lowerTitle.includes('berhasil')) {
      return { name: 'checkmark-circle', color: '#10B981' };
    }
    if (lowerTitle.includes('keluar') || lowerTitle.includes('hapus')) {
      return { name: 'warning', color: '#F59E0B' };
    }
    return { name: 'information-circle', color: '#3B82F6' };
  };

  const defaultButtons: AlertButton[] = [{ text: 'OK', style: 'default' }];
  const buttonsToRender = config?.buttons && config.buttons.length > 0 ? config.buttons : defaultButtons;

  return (
    <>
      {children}
      {visible && config && (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
          <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="justify-center items-center px-6">
            <View className="absolute inset-0 bg-black/60" />
            
            <Animated.View 
              style={{ transform: [{ scale: scaleAnim }] }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl elevation-10"
            >
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-3">
                  <Ionicons 
                    name={getIconName(config.title).name as any} 
                    size={36} 
                    color={getIconName(config.title).color} 
                  />
                </View>
                <Text className="text-xl font-bold text-slate-900 text-center mb-2">
                  {config.title}
                </Text>
                {config.message && (
                  <Text className="text-slate-500 text-center text-sm leading-relaxed">
                    {config.message}
                  </Text>
                )}
              </View>

              <View className={`flex ${buttonsToRender.length > 2 ? 'flex-col' : 'flex-row'} gap-3 mt-4`}>
                {buttonsToRender.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => closeAlert(btn.onPress)}
                      className={`flex-1 rounded-2xl py-3.5 items-center justify-center ${
                        isCancel ? 'bg-slate-100' : isDestructive ? 'bg-red-50' : 'bg-slate-900'
                      }`}
                    >
                      <Text className={`font-semibold text-base ${
                        isCancel ? 'text-slate-700' : isDestructive ? 'text-red-600' : 'text-white'
                      }`}>
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </>
  );
};
