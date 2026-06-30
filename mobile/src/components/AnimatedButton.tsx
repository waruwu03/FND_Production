import React, { useRef } from 'react';
import { Pressable, PressableProps, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  scaleTo?: number;
  className?: string;
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  scaleTo = 0.95,
  style,
  onPress,
  disabled,
  className,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.parallel([
      Animated.spring(scale, { toValue: scaleTo, damping: 15, stiffness: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        className={className}
        style={[{ transform: [{ scale }], opacity }, style, disabled && styles.disabled]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
