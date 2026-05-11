import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AvatarPickerProps {
  currentAvatarType: string;
  currentAvatarStyle: string;
  onSelect: (type: string, style: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatarType,
  currentAvatarStyle,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Avatar</Text>
      <View style={styles.optionsContainer}>
        {/* Placeholder for simple selection */}
        <TouchableOpacity 
          style={[styles.option, currentAvatarStyle === 'islamic_minimal' && styles.selected]}
          onPress={() => onSelect('default_vector', 'islamic_minimal')}
        >
          <Text style={styles.optionText}>Minimal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.option, currentAvatarStyle === 'calligraphy' && styles.selected]}
          onPress={() => onSelect('default_vector', 'calligraphy')}
        >
          <Text style={styles.optionText}>Calligraphy</Text>
        </TouchableOpacity>
        {/* TODO: Implement custom upload once avatars bucket is setup */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(51, 51, 51, 0.1)',
  },
  selected: {
    borderColor: '#333333',
    backgroundColor: 'rgba(51, 51, 51, 0.05)',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});
