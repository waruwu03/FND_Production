import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 250 });
    opacity.value = withTiming(0.8, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[animatedStyle, style, disabled && styles.disabled]}>
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
