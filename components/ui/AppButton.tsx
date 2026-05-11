import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import React from 'react';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost' | 'destructive';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const baseStyles = 'py-3.5 px-5 rounded-2xl flex-row justify-center items-center';
  
  const variantStyles = {
    solid: 'bg-[#333333]',
    outline: 'bg-transparent border-2 border-[#333333]',
    ghost: 'bg-transparent',
    destructive: 'bg-red-500',
  };

  const textStyles = {
    solid: 'text-[#f4f1ea] font-bold',
    outline: 'text-[#333333] font-bold',
    ghost: 'text-[#333333] font-bold',
    destructive: 'text-white font-bold',
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'solid' ? '#f4f1ea' : '#333333'} />
      ) : (
        <Text className={`${textStyles[variant]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
