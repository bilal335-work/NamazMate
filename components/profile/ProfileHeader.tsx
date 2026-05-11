import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { UserAvatar } from '@/components/ui/UserAvatar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Camera } from 'lucide-react-native';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  onEditAvatar: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  email,
  onEditAvatar,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <UserAvatar size={100} />
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.primary }]} 
          onPress={onEditAvatar}
          activeOpacity={0.8}
        >
          <Camera size={16} color="white" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
      <Text style={[styles.email, { color: colors.text + '60' }]}>{email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
