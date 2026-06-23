import { Modal, View, Text, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { AppButton } from './AppButton';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: 'info' | 'destructive';
  showCloseButton?: boolean;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  secondaryLabel,
  onSecondary,
  variant = 'info',
  showCloseButton = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {onConfirm && (
                <AppButton
                  title={confirmLabel}
                  variant={variant === 'destructive' ? 'destructive' : 'solid'}
                  onPress={onConfirm}
                  style={styles.button}
                />
              )}
              {onSecondary && (
                <AppButton
                  title={secondaryLabel || 'Action'}
                  variant="outline"
                  onPress={onSecondary}
                  style={styles.button}
                />
              )}
              {showCloseButton && (
                <AppButton
                  title="Not now"
                  variant="ghost"
                  onPress={onClose}
                  style={styles.button}
                  textStyle={{ color: '#64748b' }}
                />
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f4f1ea',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  content: {
    padding: 32,
  },
  title: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 24,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 52,
  },
});
