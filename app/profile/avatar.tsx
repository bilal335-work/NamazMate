import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AvatarPicker } from '@/components/profile/AvatarPicker';

export default function AvatarPickerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { profile, isLoading } = useProfileSettings();
  const { updateProfile } = useUpdateProfile();

  const [selectedKey, setSelectedKey] = useState(profile?.avatar_key || null);

  const handleSave = () => {
    if (!selectedKey) {
      Alert.alert('Selection Required', 'Please select an avatar before saving.');
      return;
    }

    updateProfile.mutate({
      avatar_type: 'default_vector',
      avatar_style: 'islamic_minimal',
      avatar_key: selectedKey,
    }, {
      onSuccess: () => {
        router.back();
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to update avatar');
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f4f1ea' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Choose Avatar</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateProfile.isPending}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewContainer}>
          <UserAvatar size={160} type="default_vector" style={selectedKey} />
          <Text style={[styles.previewLabel, { color: colors.text + '40' }]}>Preview</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>DEFAULT AVATARS</Text>
          <AvatarPicker 
            gender={profile?.gender as any}
            selectedAvatarKey={selectedKey}
            onSelect={(avatar) => setSelectedKey(avatar.storagePath)}
          />
        </View>

        <View style={styles.uploadSection}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>CUSTOM PHOTO</Text>
          <TouchableOpacity 
            style={[styles.uploadPlaceholder, { backgroundColor: 'white', borderColor: colors.text + '10' }]}
            onPress={() => Alert.alert('Coming Soon', 'Custom photo uploads will be available in the next version.')}
          >
            <Text style={{ color: colors.text + '40' }}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {updateProfile.isPending && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  previewLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    marginLeft: 4,
  },
  uploadSection: {
    marginBottom: 32,
  },
  uploadPlaceholder: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
