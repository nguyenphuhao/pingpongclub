import * as React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { COLORS } from '@pingclub/mobile-ui/tokens';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // Animate logo entrance
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });
    
    opacity.value = withTiming(1, { duration: 800 });

    // Auto finish after 2.5 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <LinearGradient
      colors={[
        '#C9C2E8', // Light purple at top
        '#E8E4F5', // Lighter purple
        '#F5F3FA', // Very light purple
        '#FFFCF8', // Almost white with slight warmth
      ]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Animated.View 
        style={[styles.content, logoAnimatedStyle]}
        entering={FadeIn.duration(600)}
      >
        {/* Logo */}
        <Image
          source={require('@/assets/images/splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
      </Animated.View>

      {/* Bottom indicator */}
      <View style={styles.bottomIndicator}>
        <View style={styles.indicator} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: height,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    width: 190,
    height: 200,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.secondary.main, // Orange color
    letterSpacing: 2,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  indicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 100,
  },
});

