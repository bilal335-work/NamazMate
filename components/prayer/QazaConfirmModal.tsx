import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  FadeIn, 
  FadeOut,
} from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface QazaConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prayerName: string;
  isPending: boolean;
}

export const QazaConfirmModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  prayerName,
  isPending 
}: QazaConfirmModalProps) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withTiming(0, { duration: 150 });
    } else {
      scale.value = 0.9;
      opacity.value = 0;
      translateY.value = 10;
    }
  }, [visible, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28, 25, 23, 0.4)' }]} />

        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <AlertCircle size={32} color="#44403c" />
            </View>
          </View>

          <Text style={styles.title}>Mark as Qaza?</Text>
          <Text style={styles.description}>
            You are about to log {prayerName} as a missed prayer. This action will be recorded in your history.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={onConfirm}
              disabled={isPending}
            >
              <Text style={styles.primaryButtonText}>Yes, Mark as Qaza</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  container: {
    width: Math.min(width - 48, 340),
    backgroundColor: '#fffdfa',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    // Clay shadow effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e7e5e4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#292524',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fffdfa',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#e7e5e4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#44403c',
    fontSize: 16,
    fontWeight: '600',
  },
});
