import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
} from 'react-native-reanimated';

export const WelcomeBackground = () => {
  const { width, height } = useWindowDimensions();
  
  // Rotation shared values
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);

  useEffect(() => {
    // Shape 1: Clockwise (42s)
    rotation1.value = withRepeat(
      withTiming(360, {
        duration: 42000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Shape 2: Counter-clockwise (56s)
    rotation2.value = withRepeat(
      withTiming(-360, {
        duration: 56000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
  }));

  // Massive size to ensure only the top curve is visible as a "wave"
  const shapeSize = width * 3.5;

  return (
    <View style={styles.container}>
      {/* Wave Shape 1 */}
      <Animated.View 
        style={[
          styles.shape, 
          { 
            width: shapeSize, 
            height: shapeSize, 
            backgroundColor: '#333333',
            left: -width * 1.25,
            bottom: -shapeSize * 0.72,
            borderRadius: shapeSize * 0.42,
          },
          animatedStyle1
        ]} 
      />
      
      <Animated.View 
        style={[
          styles.shape, 
          { 
            width: shapeSize, 
            height: shapeSize, 
            backgroundColor: '#1a1a1a',
            right: -width * 1.25,
            bottom: -shapeSize * 0.78,
            borderRadius: shapeSize * 0.4,
          },
          animatedStyle2
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#f4f1ea',
  },
  shape: {
    position: 'absolute',
    opacity: 0.08, // 8% opacity as requested
  },
});
