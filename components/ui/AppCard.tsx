import { View, ViewProps, StyleSheet } from 'react-native';
import React from 'react';

interface AppCardProps extends ViewProps {
  variant?: 'solid' | 'outline' | 'muted' | 'row';
  children: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'outline',
  children,
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'solid':
        return styles.solid;
      case 'outline':
        return styles.outline;
      case 'muted':
        return styles.muted;
      case 'row':
        return styles.row;
      default:
        return styles.outline;
    }
  };

  return (
    <View 
      style={[getVariantStyle(), style]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  solid: {
    backgroundColor: '#333333',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  muted: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f172a',
    opacity: 0.1,
    padding: 24,
    borderRadius: 0,
  },
  row: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
