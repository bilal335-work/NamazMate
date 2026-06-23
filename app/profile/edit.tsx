import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';

import { useAuth } from '@/features/auth/hooks/useAuth';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { profile, isLoading } = useProfileSettings();
  const { updateProfile } = useUpdateProfile();

  const [name, setName] = useState(profile?.full_name || '');
  const [gender, setGender] = useState(profile?.gender || 'prefer_not_to_say');

  React.useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setGender(profile.gender || 'prefer_not_to_say');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: name.trim(),
        gender,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const genders = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f4f1ea' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateProfile.isPending}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>FULL NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'white', color: colors.text, borderColor: colors.text + '10' }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.text + '30'}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text + '60' }]}>GENDER</Text>
          <Text style={{ color: '#ef4444', fontSize: 10, marginBottom: 8, fontWeight: 'bold' }}>
            Debug: URL = &quot;{process.env.EXPO_PUBLIC_SUPABASE_URL}&quot;, userId = &quot;{user?.id}&quot;
          </Text>
          <Text style={{ color: '#ef4444', fontSize: 10, marginBottom: 8, fontWeight: 'bold' }}>
            Debug: profile.gender = &quot;{profile?.gender}&quot;, state.gender = &quot;{gender}&quot;
          </Text>
          <Text style={{ color: '#ef4444', fontSize: 9, marginBottom: 8 }}>
            Debug: profileObj = {JSON.stringify(profile)}
          </Text>
          <View style={[styles.genderContainer, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
            {genders.map((g, index) => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.genderOption,
                  index !== genders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.text + '05' }
                ]}
                onPress={() => setGender(g.value)}
              >
                <Text style={[styles.genderLabel, { color: colors.text }]}>{g.label}</Text>
                {gender === g.value && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.hint, { color: colors.text + '40' }]}>
            Changing gender only affects which prayers are labeled as obligatory (e.g. Jummah for males).
          </Text>
        </View>
      </View>

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
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  genderContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  genderLabel: {
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 12,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
