import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  interpolateColor,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ChevronsRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';


const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;
const KNOB_SIZE = 56;
const TRACK_HEIGHT = 76;
const MAX_DRAG = SLIDER_WIDTH - KNOB_SIZE - 12; 
const SUCCESS_THRESHOLD = 150;

interface SlideToMarkProps {
  prayerName: string;
  onComplete: () => void;
  isCompleted?: boolean;
  completedTime?: string;
  successLabel?: string;
  prayerTime?: string;
  isBlocked?: boolean;
  blockedReason?: string;
}

export const SlideToMark: React.FC<SlideToMarkProps> = ({ 
  prayerName, 
  onComplete, 
  isCompleted: initialCompleted = false,
  completedTime,
  successLabel = 'Completed',
  prayerTime,
  isBlocked = false,
  blockedReason,
}) => {
  const [completed, setCompleted] = useState(initialCompleted);
  const [showWarning, setShowWarning] = useState(false);
  const translateX = useSharedValue(initialCompleted ? MAX_DRAG : 0);
  const successAnim = useSharedValue(initialCompleted ? 1 : 0);
  const warningAnim = useSharedValue(0);
  const sweepAnim = useSharedValue(-1);

  useEffect(() => {
    if (initialCompleted !== completed) {
      setCompleted(initialCompleted);
      successAnim.value = withTiming(initialCompleted ? 1 : 0, { duration: 300 });
      translateX.value = withSpring(initialCompleted ? MAX_DRAG : 0, { 
        damping: 24,
        stiffness: 220,
        mass: 0.8,
        overshootClamping: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompleted]);

  useEffect(() => {
    warningAnim.value = withTiming(showWarning ? 1 : 0, { duration: 250 });
    
    if (showWarning) {
      const timer = setTimeout(() => {
        setShowWarning(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showWarning, warningAnim]);

  const fillScale = useSharedValue(0);
  const fillOpacity = useSharedValue(0);

  const handleComplete = () => {
    // Start liquid fill animation
    fillOpacity.value = 1;
    fillScale.value = withTiming(1, { 
      duration: 350, 
      easing: Easing.bezier(0.2, 0, 0, 1) 
    }, (finished) => {
      if (finished) {
        runOnJS(finalizeCompletion)();
      }
    });

    onComplete();
  };

  const finalizeCompletion = () => {
    setCompleted(true);
    
    successAnim.value = withTiming(1, { duration: 200 });
    sweepAnim.value = withDelay(100, withTiming(1, { duration: 1500 }));
    
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
  };

  const fillStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(fillScale.value, [0, 1], [0, 30]) }
    ],
    opacity: fillOpacity.value,
  }));

  const triggerBlockedWarning = () => {
    setShowWarning(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const gesture = Gesture.Pan()
    .enabled(!completed)
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, MAX_DRAG));
    })
    .onEnd(() => {
      if (translateX.value >= SUCCESS_THRESHOLD) {
        if (isBlocked) {
          translateX.value = withSpring(0, { 
            damping: 24,
            stiffness: 220,
            mass: 0.8,
            overshootClamping: true,
          });
          runOnJS(triggerBlockedWarning)();
        } else {
          translateX.value = withSpring(MAX_DRAG, { 
            damping: 24,
            stiffness: 220,
            mass: 0.8,
            overshootClamping: true,
          });
          runOnJS(handleComplete)();
        }
      } else {
        translateX.value = withSpring(0, { 
          damping: 24,
          stiffness: 220,
          mass: 0.8,
          overshootClamping: true,
        });
      }
    });

  const progressFillStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_SIZE,
    opacity: completed 
      ? 0 
      : interpolate(successAnim.value, [0, 1], [1, 0]) * (1 - warningAnim.value),
    display: (completed || successAnim.value > 0.9 || warningAnim.value > 0.9) ? 'none' : 'flex',
  }));

  const containerStyle = useAnimatedStyle(() => {
    const isJummah = prayerName === 'Jummah';
    const initialBorderColor = isJummah ? 'rgba(196, 155, 102, 0.4)' : '#f1f5f9';
    
    const baseBg = interpolateColor(successAnim.value, [0, 1], ['#ffffff', '#10b981']);
    const baseBorder = interpolateColor(successAnim.value, [0, 1], [initialBorderColor, '#10b981']);
    
    return {
      backgroundColor: interpolateColor(warningAnim.value, [0, 1], [baseBg, '#ef4444']),
      borderColor: interpolateColor(warningAnim.value, [0, 1], [baseBorder, '#ef4444']),
      overflow: 'hidden',
      shadowColor: isJummah ? '#c49b66' : '#000',
      shadowOpacity: isJummah ? interpolate(successAnim.value, [0, 1], [0.18, 0.1]) : 0.1,
      shadowRadius: isJummah ? interpolate(successAnim.value, [0, 1], [6, 4]) : 4,
      elevation: isJummah ? interpolate(successAnim.value, [0, 1], [4, 3]) : 3,
    };
  });

  const knobStyle = useAnimatedStyle(() => {
    const baseBg = interpolateColor(successAnim.value, [0, 1], ['#1c1c1e', '#ffffff']);
    return {
      transform: [{ translateX: translateX.value }],
      backgroundColor: interpolateColor(warningAnim.value, [0, 1], [baseBg, '#ffffff']),
    };
  });

  const instructionTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SUCCESS_THRESHOLD], [1, 0]),
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sweepAnim.value, [-1, 1], [-SLIDER_WIDTH, SLIDER_WIDTH * 2]) },
      { skewX: '-20deg' }
    ],
  }));

  // Celebration overlay is now managed in the parent PremiumPrayerList

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Background Progress Fill */}
          <Animated.View style={[styles.progressFill, progressFillStyle]} />

          {/* Liquid Fill Element */}
          <Animated.View 
            style={[
              styles.liquidDroplet, 
              { backgroundColor: '#10b981' },
              fillStyle
            ]} 
          />

          {/* Finishing Sweep */}
          <Animated.View style={[styles.sweep, sweepStyle]} pointerEvents="none">
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="white" stopOpacity="0" />
                  <Stop offset="0.5" stopColor="white" stopOpacity="0.4" />
                  <Stop offset="1" stopColor="white" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#sweepGrad)" />
            </Svg>
          </Animated.View>

          {!completed ? (
            <View key="idle-content" style={styles.idleContent}>
              <View style={styles.textContainer}>
                {showWarning ? (
                  <Text style={styles.warningText}>
                    {blockedReason || 'Jummah Jamaat starts at 1:15 PM'}
                  </Text>
                ) : (
                  <Animated.View style={[styles.textWrapper, instructionTextStyle]}>
                    {prayerName === 'Jummah' ? (
                      <Text style={styles.instructionText}>
                        Slide to mark <Text style={styles.jummahHighlight}>Jummah</Text>{prayerTime ? ` (${prayerTime})` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.instructionText}>
                        Slide to mark {prayerName}{prayerTime ? ` (${prayerTime})` : ''}
                      </Text>
                    )}
                  </Animated.View>
                )}
              </View>

              <Animated.View key="idle-knob" style={[styles.knob, knobStyle]}>
                <ChevronsRight color={showWarning ? '#ef4444' : '#ffffff'} size={24} />
              </Animated.View>
            </View>
          ) : (
            <View key="success-content" style={styles.successContent}>
              <View style={styles.successTextWrapper}>
                <Text style={styles.successTitle}>{prayerName} Marked</Text>
                <Text style={styles.successSubtitle}>{completedTime || 'Just now'} • {successLabel}</Text>
              </View>
              
              <Animated.View key="success-knob" style={[styles.knob, { backgroundColor: '#ffffff' }]}>
                <Check color="#10b981" size={28} strokeWidth={3} />
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    padding: 6,
    position: 'relative',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressFill: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: (TRACK_HEIGHT - 12) / 2,
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 20,
  },
  idleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    left: KNOB_SIZE + 12,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      }
    })
  },
  successContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
  },
  successTextWrapper: {
    flex: 1,
    zIndex: 5,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  liquidDroplet: {
    position: 'absolute',
    right: -20,
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: -20,
    zIndex: 0,
  },
  jummahHighlight: {
    color: '#c49b66',
    fontWeight: '800',
  },
  jummahAccentDot: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c49b66',
    opacity: 0.8,
    zIndex: 1,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
