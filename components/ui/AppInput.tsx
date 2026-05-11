import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerClassName = '',
  ...props
}) => {
  return (
    <View className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-[10px] font-bold text-slate-900 uppercase tracking-widest px-1">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#94a3b8"
        className={`border-b border-[#333333]/20 py-2.5 px-1 text-slate-900 text-base ${
          error ? 'border-red-500' : 'focus:border-[#333333]'
        }`}
        accessibilityLabel={label || props.placeholder}
        accessibilityInvalid={!!error}
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-[10px] font-bold px-1 uppercase tracking-wider">
          {error}
        </Text>
      )}
    </View>
  );
};
