import { View, Text } from 'react-native';
import React from 'react';
import { PrayerStatus } from '../../types/prayer';

interface StatusBadgeProps {
  status: PrayerStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const statusConfig: Record<PrayerStatus, { bg: string; text: string; label: string; border?: string }> = {
    prayed: {
      bg: 'bg-[#333333]',
      text: 'text-[#f4f1ea]',
      label: 'Prayed',
    },
    available: {
      bg: 'bg-transparent',
      border: 'border border-[#333333]',
      text: 'text-[#333333]',
      label: 'Available',
    },
    locked: {
      bg: 'bg-slate-200',
      text: 'text-slate-500',
      label: 'Locked',
    },
    qaza_available: {
      bg: 'bg-amber-100',
      border: 'border border-amber-500/20',
      text: 'text-amber-700',
      label: 'Qaza',
    },
    qaza_prayed: {
      bg: 'bg-amber-500',
      text: 'text-white',
      label: 'Qaza Prayed',
    },
    not_completed: {
      bg: 'bg-red-50',
      border: 'border border-red-500/10',
      text: 'text-red-600',
      label: 'Not Done',
    },
  };

  const config = statusConfig[status];

  return (
    <View 
      className={`px-3 py-1 rounded-full ${config.bg} ${config.border || ''} ${className}`}
    >
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
};
