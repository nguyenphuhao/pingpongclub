import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvironmentBadge, EnvironmentInfo } from '@/components/EnvironmentBadge';
import { Link, Stack } from 'expo-router';
import { MoonStarIcon, StarIcon, SunIcon, Sparkles, Palette, Zap } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, ScrollView } from 'react-native';
import { logEnvironment } from '@/lib/config';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
  title: 'Dokifree App',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

export default function Screen() {
  const { colorScheme } = useColorScheme();

  React.useEffect(() => {
    // Log environment on app start
    logEnvironment();
  }, []);

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <ScrollView className="flex-1 bg-background">
        <EnvironmentBadge />
        <View className="flex-1 items-center gap-6 p-6 pt-20">
          <Image source={require('@/assets/images/splash.png')} style={IMAGE_STYLE} resizeMode="contain" />
          
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Dokifree App</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Built with Design System & React Native Reusables
            </Text>
          </View>
          
          {/* Quick Links */}
          <View className="gap-3 w-full max-w-md">
            <Link href="/splash-demo" asChild>
              <Button size="lg" variant="default">
                <Icon as={Sparkles} className="mr-2" />
                <Text>Splash Screen Demo</Text>
              </Button>
            </Link>
            <Link href="/design-system" asChild>
              <Button variant="secondary" size="lg">
                <Icon as={Palette} className="mr-2" />
                <Text>Design System</Text>
              </Button>
            </Link>
          </View>

          {/* Feature Cards */}
          <View className="gap-4 w-full max-w-md">
            {/* Environment Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>🔧 Environment</CardTitle>
                <CardDescription>Current app configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <EnvironmentInfo showDetails />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎨 Color Palette</CardTitle>
                <CardDescription>Primary & Secondary colors</CardDescription>
              </CardHeader>
              <CardContent>
                <View className="flex-row flex-wrap gap-2">
                  <Badge variant="default">
                    <Text>Primary</Text>
                  </Badge>
                  <Badge variant="secondary">
                    <Text>Secondary</Text>
                  </Badge>
                  <Badge variant="destructive">
                    <Text>Error</Text>
                  </Badge>
                  <Badge variant="outline">
                    <Text>Outline</Text>
                  </Badge>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚡ Features</CardTitle>
                <CardDescription>What's included</CardDescription>
              </CardHeader>
              <CardContent className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon as={Zap} className="text-primary" size={16} />
                  <Text className="text-sm">31 UI Components</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Icon as={Zap} className="text-primary" size={16} />
                  <Text className="text-sm">Custom Design Tokens</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Icon as={Zap} className="text-primary" size={16} />
                  <Text className="text-sm">Animated Splash Screens</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Icon as={Zap} className="text-primary" size={16} />
                  <Text className="text-sm">Native Module Support</Text>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* External Links */}
          <View className="gap-2 w-full max-w-md mb-8">
            <Link href="https://reactnativereusables.com" asChild>
              <Button variant="outline" size="lg">
                <Text>Browse Documentation</Text>
                <Icon as={StarIcon} className="ml-2" />
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
