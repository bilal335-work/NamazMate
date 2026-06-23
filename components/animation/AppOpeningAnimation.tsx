import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  runOnJS,
  useReducedMotion,
  withRepeat,
  withSequence
} from 'react-native-reanimated';

interface AppOpeningAnimationProps {
  onComplete: () => void;
  ready?: boolean;
}

const BRAND_NAME = 'NamazMate';
const TYPEWRITER_SPEED = 80;
const HOLD_DURATION = 600;
const MAX_READY_TIMEOUT = 8000; // Increased to 8s to ensure data preloading completes
const STAIRCASE_DURATION = 800;
const STAIRCASE_STAGGER = 50;
const TEXT_EXIT_DELAY = 120;
const EASING = Easing.bezier(0.76, 0, 0.24, 1);

interface ColumnProps {
  index: number;
  width: number;
  height: number;
  startAnimation: boolean;
}

const Column: React.FC<ColumnProps> = ({ index, width, height, startAnimation }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (startAnimation) {
      translateY.value = withDelay(index * STAIRCASE_STAGGER, withTiming(height, {
        duration: STAIRCASE_DURATION,
        easing: EASING
      }));
    }
  }, [startAnimation, height, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View 
      style={[
        styles.column, 
        { width, left: index * width },
        animatedStyle
      ]} 
    />
  );
};

export const AppOpeningAnimation: React.FC<AppOpeningAnimationProps> = ({ onComplete, ready }) => {
  const { width, height } = useWindowDimensions();
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [typewriterFinished, setTypewriterFinished] = useState(false);
  const [triggerStaircase, setTriggerStaircase] = useState(false);
  
  const textTranslateY = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const cursorOpacity = useSharedValue(1);
  const isReducedMotion = useReducedMotion();

  const startStaircase = useCallback(() => {
    if (triggerStaircase) return;
    setTriggerStaircase(true);

    // Phase 3: Staircase Down Reveal
    textTranslateY.value = withDelay(TEXT_EXIT_DELAY, withTiming(height, { 
      duration: STAIRCASE_DURATION, 
      easing: EASING 
    }));
    textOpacity.value = withDelay(TEXT_EXIT_DELAY, withTiming(0, { 
      duration: STAIRCASE_DURATION * 0.8, 
      easing: EASING 
    }));

    // Phase 4: Hand-off
    // Total duration = Stagger * (Columns - 1) + Duration
    const totalDuration = (5 * STAIRCASE_STAGGER) + STAIRCASE_DURATION;
    setTimeout(onComplete, totalDuration);
  }, [height, onComplete, textOpacity, textTranslateY, triggerStaircase]);

  const hasStarted = React.useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (isReducedMotion) {
      onComplete();
      return;
    }

    // Phase 1: Typewriter Build-Up
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < BRAND_NAME.length) {
        setDisplayText(BRAND_NAME.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        // Phase 2: Suspense Hold
        setShowCursor(false);
        setTypewriterFinished(true);
      }
    }, TYPEWRITER_SPEED);

    return () => clearInterval(interval);
  }, [isReducedMotion, onComplete]);

  // Effect to wait for both typewriter to finish AND data to be ready
  useEffect(() => {
    if (typewriterFinished) {
      let timeout: any;
      
      if (ready) {
        // Data is already ready or just became ready
        if (__DEV__) console.log('[AppOpeningAnimation] Ready! Starting staircase.');
        startStaircase();
      } else {
        // Wait for data with a max timeout
        timeout = setTimeout(() => {
          if (__DEV__) console.log('[AppOpeningAnimation] Ready timeout reached, forcing reveal');
          startStaircase();
        }, MAX_READY_TIMEOUT);
      }
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [typewriterFinished, ready, startStaircase]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const cursorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const columnWidth = width / 6;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: triggerStaircase ? 'transparent' : '#1a1a1a' }]}>
      <View style={styles.columnsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Column 
            key={index}
            index={index}
            width={columnWidth}
            height={height}
            startAnimation={triggerStaircase}
          />
        ))}
      </View>

      <View style={styles.textContainer} pointerEvents="none">
        <Animated.View style={[styles.textWrapper, textAnimatedStyle]}>
          <Text style={styles.text}>{displayText}</Text>
          {showCursor && (
            <Animated.View style={[styles.cursor, cursorAnimatedStyle]} />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  columnsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  column: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 48,
    fontFamily: 'TitanOne_400Regular', // Using the specified font
    letterSpacing: 0,
  },
  cursor: {
    width: 12,
    height: 36, // ~0.7em of 48 is ~34px
    backgroundColor: '#ffffff',
    marginLeft: 6,
    borderRadius: 6,
  },
});
