import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import { ArrowRight } from 'lucide-react-native';
import { useTransition } from '@/features/auth/context/TransitionContext';

export default function WelcomeScreen() {
  const { animateAndNavigate } = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const getStartedRef = useRef<any>(null);
  const signInRef = useRef<any>(null);

  const handleNavigate = (path: string, e: any) => {
    if (isNavigating) return;
    const { pageX, pageY } = e.nativeEvent;
    setIsNavigating(true);
    animateAndNavigate(path, { x: pageX, y: pageY, width: 0, height: 0 });
  };

  return (
    <View style={styles.root}>
      <WelcomeBackground />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topContainer}>
            <Text style={styles.brand}>NamazMate</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.subtitle}>
              Track your prayers, stay consistent, and connect with a prayer partner.
            </Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomContainer}>
            <View style={styles.buttonGroup}>
              <AppButton
                ref={getStartedRef}
                title="GET STARTED"
                onPress={(e) => handleNavigate('/(auth)/sign-up', e)}
                variant="solid"
                disabled={isNavigating}
                icon={<ArrowRight size={18} color="#f4f1ea" strokeWidth={3} />}
                iconPosition="right"
                style={styles.button}
              />
              
              <AppButton
                ref={signInRef}
                title="I ALREADY HAVE AN ACCOUNT"
                onPress={(e) => handleNavigate('/(auth)/sign-in', e)}
                variant="outline"
                disabled={isNavigating}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    alignItems: 'center',
  },
  brand: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 56, // Slightly larger as seen in image
    color: '#0f172a',
    letterSpacing: -2, // Tighter
    textAlign: 'center',
  },
  divider: {
    height: 3,
    width: 72,
    backgroundColor: '#333333',
    marginVertical: 32,
    borderRadius: 2,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 18, // Slightly larger for better readability
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 280,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 64, // Added significant gap from description
  },
  buttonGroup: {
    gap: 16,
    width: '100%',
    maxWidth: 340, // Slightly wider for a more premium presence
  },
  button: {
    width: '100%',
    borderRadius: 20,
    height: 60, // Slightly taller for more premium feel
  }
});
