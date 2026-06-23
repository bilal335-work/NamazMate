import React from 'react';
import { View, Image, StyleSheet, StyleProp } from 'react-native';
import { User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface UserAvatarProps {
  type?: 'default_vector' | 'custom_upload';
  style?: string | null;
  url?: string | null;
  size?: number;
  containerStyle?: StyleProp<any>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  type = 'default_vector',
  style,
  url,
  size = 40,
  containerStyle,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (type === 'custom_upload' && url) {
    return (
      <Image 
        source={{ uri: url }} 
        style={[
          styles.avatar, 
          { width: size, height: size, borderRadius: size / 2 },
          containerStyle
        ]} 
      />
    );
  }

  // Default vector avatar
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: colors.text + '10'
        },
        containerStyle
      ]}
    >
      <User size={size * 0.6} color={colors.text + '40'} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    resizeMode: 'cover',
  }
});
