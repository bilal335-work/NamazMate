import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  runOnUI,
  useReducedMotion,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const EXPANSION_DURATION = 400;
const REVEAL_DURATION = 800;
const EASING = Easing.bezier(0.76, 0, 0.24, 1);

interface TransitionContextType {
  animateAndNavigate: (targetPath: string, layout?: { x: number, y: number, width: number, height: number }) => void;
  isInitialOpening: boolean;
  completeInitialOpening: () => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) throw new Error('useTransition must be used within a TransitionProvider');
  return context;
};

export const TransitionProvider: React.FC<{ children: React.ReactNode; onNavigate: (path: string) => void }> = ({ children, onNavigate }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isReducedMotion = useReducedMotion();
  const isMounted = useRef(true);
  
  const [isInitialOpening, setIsInitialOpening] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'expanding' | 'bridging' | 'revealing'>('idle');

  const expansionProgress = useSharedValue(0);
  const expansionX = useSharedValue(0);
  const expansionY = useSharedValue(0);
  const expansionW = useSharedValue(0);
  const expansionH = useSharedValue(0);
  
  const revealProgress = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const finishTransition = useCallback(() => {
    if (!isMounted.current) return;
    setIsAnimating(false);
    setTransitionPhase('idle');
  }, []);

  const startReveal = useCallback(() => {
    if (!isMounted.current) return;
    setTransitionPhase('revealing');
    
    revealProgress.value = withTiming(1, {
      duration: REVEAL_DURATION,
      easing: EASING,
    }, (finished) => {
      if (finished) {
        runOnJS(finishTransition)();
      }
    });
  }, [revealProgress, finishTransition]);

  const handleNavigation = useCallback((path: string) => {
    if (!isMounted.current) return;
    
    // Switch to bridging phase to keep screen covered with solid color
    setTransitionPhase('bridging');
    onNavigate(path);
    
    // Navigation delay
    setTimeout(() => {
      if (isMounted.current) startReveal();
    }, 150);
  }, [onNavigate, startReveal]);

  const animateAndNavigate = useCallback((path: string, layout?: { x: number, y: number, width: number, height: number }) => {
    if (!path || isAnimating) return;

    if (isReducedMotion || screenWidth <= 0 || screenHeight <= 0) {
      onNavigate(path);
      return;
    }

    // Reset progress values
    expansionProgress.value = 0;
    revealProgress.value = 0;

    const targetX = layout ? layout.x : screenWidth / 2;
    const targetY = layout ? layout.y : screenHeight / 2;
    const targetW = layout ? layout.width : 0;
    const targetH = layout ? layout.height : 0;

    runOnUI(() => {
      'worklet';
      expansionX.value = targetX;
      expansionY.value = targetY;
      expansionW.value = targetW;
      expansionH.value = targetH;
      
      // We need to set this on JS thread too for the state checks
      runOnJS(setIsAnimating)(true);
      runOnJS(setTransitionPhase)('expanding');

      expansionProgress.value = withTiming(1, {
        duration: EXPANSION_DURATION,
        easing: EASING,
      }, (finished) => {
        if (finished) {
          runOnJS(handleNavigation)(path);
        }
      });
    })();
  }, [screenWidth, screenHeight, isReducedMotion, isAnimating, onNavigate, handleNavigation, expansionProgress, revealProgress, expansionX, expansionY, expansionW, expansionH]);

  const expansionStyle = useAnimatedStyle(() => {
    const targetSize = Math.max(screenWidth, screenHeight) * 4;
    const size = interpolate(expansionProgress.value, [0, 1], [0, targetSize]);
    const borderRadius = size / 2;
    
    const centerX = expansionX.value + expansionW.value / 2;
    const centerY = expansionY.value + expansionH.value / 2;
    
    return {
      width: size,
      height: size,
      borderRadius: borderRadius,
      backgroundColor: '#1a1a1a',
      position: 'absolute',
      left: centerX - size / 2,
      top: centerY - size / 2,
    };
  });

  const Column = ({ index }: { index: number }) => {
    const columnWidth = screenWidth / 6;
    const animatedStyle = useAnimatedStyle(() => {
      const start = index * 0.0625;
      const end = Math.min(start + 0.8, 1);
      
      const translateY = interpolate(
        revealProgress.value,
        [start, end],
        [0, screenHeight],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }],
      };
    });

    return (
      <Animated.View
        style={[
          styles.column,
          { 
            width: columnWidth + 0.6,
            left: index * columnWidth,
            height: screenHeight,
            backgroundColor: '#1a1a1a',
          },
          animatedStyle,
        ]}
      />
    );
  };

  return (
    <TransitionContext.Provider value={{ animateAndNavigate, isInitialOpening, completeInitialOpening: () => setIsInitialOpening(false) }}>
      <View style={{ flex: 1 }}>
        {children}
        
        {transitionPhase !== 'idle' && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]} pointerEvents="none">
            {/* Phase 1: Grow in Circle */}
            {transitionPhase === 'expanding' && (
              <Animated.View style={expansionStyle} />
            )}
            
            {/* Phase 1.5: Solid Bridge during navigation */}
            {transitionPhase === 'bridging' && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]} />
            )}

            {/* Phase 2: Staircase Reveal */}
            {transitionPhase === 'revealing' && (
              <View style={StyleSheet.absoluteFill}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Column key={i} index={i} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </TransitionContext.Provider>
  );
};

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    top: 0,
  },
});
