import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { UserAvatar } from '@/components/ui/UserAvatar';

const AVATAR_STYLES = [
  'islamic_minimal',
  'geometric_pattern',
  'calligraphy_style',
  'nature_minimal',
  'abstract_soft',
];

export default function AvatarPickerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { profile, isLoading } = useProfileSettings();
  const { updateProfile } = useUpdateProfile();

  const [selectedStyle, setSelectedStyle] = useState(profile?.avatar_style || 'islamic_minimal');

  const handleSave = () => {
    updateProfile.mutate({
      avatar_type: 'default_vector',
      avatar_style: selectedStyle,
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
          <UserAvatar size={120} style={selectedStyle} />
          <Text style={[styles.previewLabel, { color: colors.text + '40' }]}>Preview</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>DEFAULT STYLES</Text>
          <View style={styles.grid}>
            {AVATAR_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.avatarOption,
                  { borderColor: selectedStyle === style ? colors.primary : colors.text + '10' }
                ]}
                onPress={() => setSelectedStyle(style)}
              >
                <UserAvatar size={60} style={style} />
                {selectedStyle === style && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.uploadSection}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>CUSTOM PHOTO</Text>
          <TouchableOpacity 
            style={[styles.uploadPlaceholder, { backgroundColor: 'white', borderColor: colors.text + '10' }]}
            onPress={() => Alert.alert('Coming Soon', 'Custom photo uploads will be available in the next version.')}
          >
            <Text style={{ color: colors.text + '40' }}>Upload from Gallery</Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.text + '40' }]}>
            TODO: Implement Supabase Storage integration for custom photo uploads once bucket security is finalized.
          </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
  hint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
