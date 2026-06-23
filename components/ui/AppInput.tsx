import { View, Text, TextInput, TextInputProps, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // If secureTextEntry is true, we use our own visibility state
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label.toUpperCase()}
        </Text>
      )}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor="#94a3b8"
          style={[
            styles.input,
            error ? styles.inputError : null,
            secureTextEntry ? styles.inputWithIcon : null
          ]}
          secureTextEntry={isSecure}
          accessibilityLabel={label || props.placeholder}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>
          {error.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b', // Slate label
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 20,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.1,
    paddingHorizontal: 2,
  },
});
