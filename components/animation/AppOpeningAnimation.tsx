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
}

const BRAND_NAME = 'NamazMate';
const TYPEWRITER_SPEED = 80;
const HOLD_DURATION = 600;
const STAIRCASE_DURATION = 800;
const STAIRCASE_STAGGER = 50;
const EASING = Easing.bezier(0.76, 0, 0.24, 1);
const CURSOR_BLINK_DURATION = 500;

interface ColumnProps {
  index: number;
  width: number;
  height: number;
  startAnimation: boolean;
  onAnimationEnd?: () => void;
}

const Column: React.FC<ColumnProps> = ({ index, width, height, startAnimation, onAnimationEnd }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (startAnimation) {
      translateY.value = withDelay(index * STAIRCASE_STAGGER, withTiming(height, {
        duration: STAIRCASE_DURATION,
        easing: EASING
      }, (finished) => {
        if (finished && onAnimationEnd) {
          runOnJS(onAnimationEnd)();
        }
      }));
    }
  }, [startAnimation, height, index, onAnimationEnd, translateY]);

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

export const AppOpeningAnimation: React.FC<AppOpeningAnimationProps> = ({ onComplete }) => {
  const { width, height } = useWindowDimensions();
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [triggerStaircase, setTriggerStaircase] = useState(false);
  
  // Shared value for text
  const textTranslateY = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const cursorOpacity = useSharedValue(1);
  const isReducedMotion = useReducedMotion();

  const startStaircase = useCallback(() => {
    // Move text down and fade out
    textTranslateY.value = withDelay(120, withTiming(height, { 
      duration: STAIRCASE_DURATION, 
      easing: EASING 
    }));
    textOpacity.value = withDelay(120, withTiming(0, { 
      duration: STAIRCASE_DURATION / 2, 
      easing: EASING 
    }));

    setTriggerStaircase(true);
  }, [height, textOpacity, textTranslateY]);

  useEffect(() => {
    if (isReducedMotion) {
      onComplete();
      return;
    }

    // Cursor blinking animation
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: CURSOR_BLINK_DURATION }),
        withTiming(1, { duration: CURSOR_BLINK_DURATION })
      ),
      -1,
      true
    );

    // Typewriter effect
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < BRAND_NAME.length) {
        setDisplayText(BRAND_NAME.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setShowCursor(false);
        // Start staircase animation after hold
        setTimeout(startStaircase, HOLD_DURATION);
      }
    }, TYPEWRITER_SPEED);

    return () => {
      clearInterval(interval);
    };
  }, [startStaircase, isReducedMotion, onComplete, cursorOpacity]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const cursorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const columnWidth = width / 6;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 6 Vertical Columns */}
      <View style={styles.columnsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Column 
            key={index}
            index={index}
            width={columnWidth}
            height={height}
            startAnimation={triggerStaircase}
            onAnimationEnd={index === 5 ? onComplete : undefined}
          />
        ))}
      </View>

      {/* Brand Text */}
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
    color: '#f4f1ea',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  cursor: {
    width: 8,
    height: 32,
    backgroundColor: '#f4f1ea',
    marginLeft: 4,
    borderRadius: 4,
  },
});
