import * as React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown,
  FadeInUp,
  useAnimatedStyle, 
  useSharedValue, 
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { COLORS } from '@pingclub/mobile-ui/tokens';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish?: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  React.useEffect(() => {
    // Logo animation with bounce effect
    logoScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      })
    );

    // Subtle rotation for logo
    logoRotate.value = withDelay(
      200,
      withSequence(
        withTiming(-5, { duration: 300, easing: Easing.ease }),
        withTiming(0, { duration: 400, easing: Easing.elastic(1) })
      )
    );

    // Text fade in and slide up
    textOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(
      600,
      withSpring(0, {
        damping: 10,
        stiffness: 100,
      })
    );

    // Auto finish after 3 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { rotate: `${logoRotate.value}deg` },
      ],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
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
      {/* Decorative circles - subtle background elements */}
      <Animated.View 
        entering={FadeIn.delay(400).duration(1000)}
        style={[styles.decorativeCircle, styles.circle1]}
      />
      <Animated.View 
        entering={FadeIn.delay(600).duration(1000)}
        style={[styles.decorativeCircle, styles.circle2]}
      />

      <View style={styles.content}>
        {/* Logo with animation */}
        <Animated.View style={logoAnimatedStyle}>
          <Image
            source={require('@/assets/images/splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* App Name with animation */}
        <Animated.View style={textAnimatedStyle}>
          
        </Animated.View>
      </View>

      {/* Bottom indicator with fade in */}
      <Animated.View 
        entering={FadeInDown.delay(800).duration(600)}
        style={styles.bottomIndicator}
      >
        <View style={styles.indicator} />
      </Animated.View>
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
    zIndex: 10,
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
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: COLORS.primary.dark,
    marginTop: 8,
    fontWeight: '500',
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
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary.main,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.secondary.main,
    bottom: -50,
    left: -50,
  },
});

