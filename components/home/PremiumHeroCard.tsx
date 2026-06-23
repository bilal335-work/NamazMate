import { PrayerState } from '@/features/prayers/hooks/usePrayerCountdown';
import { PrayerKey, TodayPrayerTimes } from '@/features/prayers/types';
import { formatPrayerTime } from '@/utils/time';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getPrayerDisplayName } from '@/utils/prayer';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width } = Dimensions.get('window');

interface PremiumHeroCardProps {
  prayerTimes: TodayPrayerTimes | null;
  countdown: {
    activePrayerKey: PrayerKey | null;
    nextPrayerKey: PrayerKey | null;
    state: PrayerState;
    timeLeft: string;
    progress: number;
  };
  timeFormat?: '12h' | '24h';
}



export const PremiumHeroCard: React.FC<PremiumHeroCardProps> = ({ 
  prayerTimes, 
  countdown, 
  timeFormat = '12h' 
}) => {
  const gold = '#c49b66';
  
  const glowOpacity = useSharedValue(0.4);
  const waveOffset = useSharedValue(0);
  const fillAnim = useSharedValue(countdown.progress);

  useEffect(() => {
    fillAnim.value = withTiming(countdown.progress, { duration: 1000 });
  }, [countdown.progress]);

  useEffect(() => {
    // Soft breathing effect for the ambient glow
    glowOpacity.value = withRepeat(
      withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Very slow, calm wave for a premium feel
    waveOffset.value = withRepeat(
      withTiming(-width, { duration: 7500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const liquidStyle = useAnimatedStyle(() => {
    const targetHeight = interpolate(fillAnim.value, [0, 1], [15, 90]);
    
    return {
      height: `${targetHeight}%`,
      opacity: glowOpacity.value,
    };
  });

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }],
  }));

  const WAVE_HEIGHT = 8;
  const waveLen = width / 1.5;
  
  const animatedPathProps = useAnimatedProps(() => {
    const d = `M0 ${WAVE_HEIGHT / 2} 
      Q${waveLen / 4} 0 ${waveLen / 2} ${WAVE_HEIGHT / 2} 
      T${waveLen} ${WAVE_HEIGHT / 2} 
      T${waveLen * 2} ${WAVE_HEIGHT / 2} 
      T${waveLen * 3} ${WAVE_HEIGHT / 2} 
      T${waveLen * 4} ${WAVE_HEIGHT / 2} 
      V240 H0 Z`;
    
    return { d };
  });

  const { gender } = useAuth();

  if (!prayerTimes) return null;

  const { state, activePrayerKey, nextPrayerKey, timeLeft } = countdown;
  const displayKey = state === 'active' ? activePrayerKey : nextPrayerKey;
  const prayerName = displayKey
    ? getPrayerDisplayName(displayKey, {
        gender,
        date: prayerTimes.prayer_date || prayerTimes.date,
        timezone: prayerTimes.timezone,
      })
    : '';
  const displayTime = formatPrayerTime(displayKey ? prayerTimes[displayKey] : null, timeFormat);

  const headerLabel = state === 'active' ? 'CURRENT PRAYER' : 'NEXT PRAYER';
  const footerPrefix = state === 'active' ? 'Ends in' : 'Starts in';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Ambient Progress/Glow Overlay */}
        <Animated.View style={[styles.liquidLayer, liquidStyle]} pointerEvents="none">
          <Animated.View style={[styles.waveContainer, waveStyle]}>
            <Svg width={width * 2} height={240} viewBox={`0 0 ${width * 2} 240`}>
              <AnimatedPath 
                animatedProps={animatedPathProps} 
                fill={gold} 
                opacity={0.14} 
              />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* Card Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.dotContainer}>
              <View style={styles.activeDot} />
            </View>
            <Text style={styles.headerText}>{headerLabel}</Text>
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.prayerName}>{prayerName}</Text>
            <Text style={styles.startTime}>
              {state === 'active' ? 'Active now' : `Starts at ${displayTime}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.countdownText}>
              {footerPrefix} <Text style={styles.timeLeftText}>{timeLeft}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 32,
    height: 220,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  liquidLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 1,
  },
  waveContainer: {
    position: 'absolute',
    top: -4, // Small overlap for the wave edge
    left: 0,
    width: width * 2,
    height: 240,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c49b66',
    shadowColor: '#c49b66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  headerText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  mainInfo: {
    marginTop: 8,
  },
  prayerName: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  startTime: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
  footer: {
    paddingBottom: 4,
  },
  countdownText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  timeLeftText: {
    color: '#c49b66',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
