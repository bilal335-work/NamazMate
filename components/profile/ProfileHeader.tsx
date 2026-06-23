import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { UserAvatar } from '@/components/ui/UserAvatar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Camera } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  SharedValue 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  avatarType?: 'default_vector' | 'custom_upload';
  avatarStyle?: string | null;
  onEditAvatar: () => void;
  scrollY: SharedValue<number>;
  headerMaxHeight: number;
  headerMinHeight: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  email,
  avatarType,
  avatarStyle,
  onEditAvatar,
  scrollY,
  headerMaxHeight,
  headerMinHeight,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const scrollDistance = headerMaxHeight - headerMinHeight;

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [1, 0.6], // Larger in header
      Extrapolate.CLAMP
    );

    const translateX = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, -75], // Balanced for centering
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, 10], // Move higher
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateX }, { translateY }],
    };
  });

  const nameAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, -100], // Move up to align with avatar
      Extrapolate.CLAMP
    );

    const translateX = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, 65], // Balanced for centering
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [1, 0.75], // Slightly smaller to fit better
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { translateX }, { scale }],
    };
  });

  const emailAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, scrollDistance * 0.5],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const headerContentStyle = useAnimatedStyle(() => {
    const paddingTop = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [insets.top + 40, insets.top + 10],
      Extrapolate.CLAMP
    );

    return {
      paddingTop,
    };
  });

  const editButtonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, scrollDistance * 0.2],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale: opacity }],
    };
  });

  return (
    <Animated.View style={[styles.container, headerContentStyle]}>
      <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
        <UserAvatar size={100} type={avatarType} style={avatarStyle} />
        <Animated.View style={[styles.editButtonContainer, editButtonAnimatedStyle]}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.primary }]} 
            onPress={onEditAvatar}
            activeOpacity={0.8}
          >
            <Camera size={16} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.name, { color: colors.text }, nameAnimatedStyle]}>
        {fullName}
      </Animated.Text>
      <Animated.Text style={[styles.email, { color: colors.text + '60' }, emailAnimatedStyle]}>
        {email}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f4f1ea',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
});
