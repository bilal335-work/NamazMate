import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import React from 'react';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost' | 'destructive' | 'primary' | 'link';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  className = '',
}) => {
  const baseStyles = 'py-3.5 px-5 rounded-2xl flex-row justify-center items-center';
  
  const actualVariant = variant === 'primary' ? 'solid' : variant;

  const variantStyles = {
    solid: 'bg-[#333333]',
    outline: 'bg-transparent border-2 border-[#333333]',
    ghost: 'bg-transparent',
    destructive: 'bg-red-500',
    link: 'bg-transparent py-2 px-1',
  };

  const textStyles = {
    solid: 'text-[#f4f1ea] font-bold',
    outline: 'text-[#333333] font-bold',
    ghost: 'text-[#333333] font-bold',
    destructive: 'text-white font-bold',
    link: 'text-[#333333] font-bold text-xs',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      className={`${actualVariant === 'link' ? variantStyles.link : baseStyles + ' ' + variantStyles[actualVariant as keyof typeof variantStyles]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={actualVariant === 'solid' ? '#f4f1ea' : '#333333'} />
      ) : (
        <Text className={`${textStyles[actualVariant as keyof typeof textStyles]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
