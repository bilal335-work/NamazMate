import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, StyleProp, View, StyleSheet, GestureResponderEvent } from 'react-native';
import React from 'react';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'solid' | 'outline' | 'ghost' | 'destructive' | 'primary' | 'link';
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton = React.forwardRef<any, AppButtonProps>(({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  loadingText,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}, ref) => {
  const actualVariant = variant === 'primary' ? 'solid' : variant;
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    switch (actualVariant) {
      case 'solid':
        return styles.solid;
      case 'outline':
        return styles.outline;
      case 'destructive':
        return styles.destructive;
      case 'link':
        return styles.link;
      default:
        return styles.solid;
    }
  };

  const getLabelStyles = () => {
    switch (actualVariant) {
      case 'solid':
        return styles.labelSolid;
      case 'outline':
        return styles.labelOutline;
      case 'destructive':
        return styles.labelDestructive;
      case 'link':
        return styles.labelLink;
      default:
        return styles.labelSolid;
    }
  };

  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        getVariantStyles(),
        isDisabled && styles.disabled,
        style
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        loadingText ? (
          <View style={styles.content}>
            <ActivityIndicator color={actualVariant === 'solid' ? '#f4f1ea' : '#0f172a'} style={styles.iconLeft} />
            <Text 
              style={[
                getLabelStyles(),
                textStyle
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {loadingText}
            </Text>
          </View>
        ) : (
          <ActivityIndicator color={actualVariant === 'solid' ? '#f4f1ea' : '#0f172a'} />
        )
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text 
            style={[
              getLabelStyles(),
              textStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
});

AppButton.displayName = 'AppButton';

const styles = StyleSheet.create({
  base: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16, // rounded-2xl style
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: '#333333', // Softer charcoal
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#333333',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  link: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  labelSolid: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '900',
    color: '#f4f1ea',
    letterSpacing: 2.4, // 0.2em of 12px
  },
  labelOutline: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '900',
    color: '#333333',
    letterSpacing: 2.4,
  },
  labelDestructive: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.15,
  },
  labelLink: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
});
