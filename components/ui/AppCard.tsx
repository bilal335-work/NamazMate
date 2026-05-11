import { View, ViewProps } from 'react-native';
import React from 'react';

interface AppCardProps extends ViewProps {
  variant?: 'solid' | 'outline' | 'muted' | 'row';
  children: React.ReactNode;
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'outline',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    solid: 'bg-[#333333] p-6 rounded-3xl shadow-lg',
    outline: 'border-2 border-[#333333] p-5 rounded-3xl bg-transparent',
    muted: 'bg-[#333333]/5 border border-[#333333]/10 p-6 rounded-3xl',
    row: 'bg-white/50 border border-[#333333]/20 p-4 rounded-2xl flex-row items-center',
  };

  return (
    <View 
      className={`${variantStyles[variant]} ${className}`} 
      {...props}
    >
      {children}
    </View>
  );
};
