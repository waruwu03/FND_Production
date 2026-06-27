import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  variant?: 'light' | 'dark';
}

export const Input = ({ label, error, className, secureTextEntry, icon, variant = 'dark', ...props }: InputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPasswordField = secureTextEntry !== undefined;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text
          style={{
            color: variant === 'light' ? '#64748B' : '#CBD5E1',
            fontWeight: '600',
            fontSize: 13,
            marginBottom: 8,
            marginLeft: 2,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: variant === 'light' ? '#F8FAFC' : 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: error ? '#EF4444' : isFocused ? '#3B82F6' : variant === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.1)',
          borderRadius: 14,
          paddingHorizontal: 16,
          minHeight: 52,
        }}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={error ? '#EF4444' : isFocused ? '#3B82F6' : variant === 'light' ? '#94A3B8' : '#64748B'}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 15,
            color: variant === 'light' ? '#0F172A' : '#F1F5F9',
          }}
          placeholderTextColor={variant === 'light' ? '#94A3B8' : '#475569'}
          secureTextEntry={isPasswordField ? !isPasswordVisible : false}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#475569"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
