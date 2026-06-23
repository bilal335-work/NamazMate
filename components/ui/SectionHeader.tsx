import { View, Text } from 'react-native';
import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <View className={`space-y-1 ${className}`}>
      <Text className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-slate-500 font-medium">
          {subtitle}
        </Text>
      )}
    </View>
  );
};
