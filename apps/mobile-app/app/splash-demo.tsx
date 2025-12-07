import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SplashScreen } from '@/components/SplashScreen';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SplashDemoScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = React.useState<'none' | 'simple' | 'animated'>('none');

  const handleSplashFinish = () => {
    setShowSplash('none');
  };

  if (showSplash === 'simple') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  if (showSplash === 'animated') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AnimatedSplash onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <Stack.Screen 
        options={{
          title: 'Splash Screen Demo',
          headerShown: true,
        }} 
      />
      <View className="p-6 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Splash Screen Variants</CardTitle>
            <CardDescription>
              Choose a splash screen variant to preview
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button 
              variant="default"
              size="lg"
              onPress={() => setShowSplash('simple')}
            >
              <Text>Simple Splash Screen</Text>
            </Button>
            
            <Button 
              variant="secondary"
              size="lg"
              onPress={() => setShowSplash('animated')}
            >
              <Text>Animated Splash Screen</Text>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Design Features</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">✓</Text>
              <Text className="flex-1 text-sm">
                Gradient background matching the design system
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">✓</Text>
              <Text className="flex-1 text-sm">
                Logo size: 190x200px as specified
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">✓</Text>
              <Text className="flex-1 text-sm">
                Orange branding (Secondary color: #FF8F2E)
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">✓</Text>
              <Text className="flex-1 text-sm">
                Purple gradient (Primary color palette)
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary">✓</Text>
              <Text className="flex-1 text-sm">
                Smooth animations with React Native Reanimated
              </Text>
            </View>
          </CardContent>
        </Card>

        <Button 
          variant="outline"
          onPress={() => router.back()}
        >
          <Text>Back to Home</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

