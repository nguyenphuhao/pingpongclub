import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '@pingclub/mobile-ui/tokens';

interface ColorSwatchProps {
  color: string;
  label: string;
  hexCode: string;
}

function ColorSwatch({ color, label, hexCode }: ColorSwatchProps) {
  return (
    <View className="flex-1 min-w-[70px] gap-2">
      <View 
        className="h-16 rounded-lg border border-border"
        style={{ backgroundColor: color }}
      />
      <View>
        <Text className="text-xs font-medium">{label}</Text>
        <Text className="text-2xs text-muted-foreground">{hexCode}</Text>
      </View>
    </View>
  );
}

export function ColorPalette() {
  return (
    <View className="gap-4 w-full">
      {/* Primary Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <ColorSwatch 
              color={COLORS.primary.lightest} 
              label="Lightest" 
              hexCode="#E7E4F9"
            />
            <ColorSwatch 
              color={COLORS.primary.main} 
              label="Main" 
              hexCode="#7C5CDB"
            />
            <ColorSwatch 
              color={COLORS.primary.dark} 
              label="Dark" 
              hexCode="#5E44B8"
            />
            <ColorSwatch 
              color={COLORS.primary.darkest} 
              label="Darkest" 
              hexCode="#463184"
            />
          </View>
        </CardContent>
      </Card>

      {/* Secondary Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Secondary Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <ColorSwatch 
              color={COLORS.secondary.lightest} 
              label="Lightest" 
              hexCode="#FFE8D4"
            />
            <ColorSwatch 
              color={COLORS.secondary.main} 
              label="Main" 
              hexCode="#FF8F2E"
            />
            <ColorSwatch 
              color={COLORS.secondary.dark} 
              label="Dark" 
              hexCode="#ED6F0D"
            />
            <ColorSwatch 
              color={COLORS.secondary.darkest} 
              label="Darkest" 
              hexCode="#5B3013"
            />
          </View>
        </CardContent>
      </Card>

      {/* Accent Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <ColorSwatch 
              color={COLORS.accent.blue} 
              label="Blue" 
              hexCode="#0D99FF"
            />
            <ColorSwatch 
              color={COLORS.accent.green} 
              label="Green" 
              hexCode="#019E5B"
            />
            <ColorSwatch 
              color={COLORS.accent.yellow} 
              label="Yellow" 
              hexCode="#FFD33F"
            />
            <ColorSwatch 
              color={COLORS.accent.red} 
              label="Red" 
              hexCode="#FF5E65"
            />
          </View>
        </CardContent>
      </Card>

      {/* Grayscale */}
      <Card>
        <CardHeader>
          <CardTitle>Grayscale</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <ColorSwatch 
              color={COLORS.gray.darkest} 
              label="Darkest" 
              hexCode="#0F0F0F"
            />
            <ColorSwatch 
              color={COLORS.gray.medium} 
              label="Medium" 
              hexCode="#525050"
            />
            <ColorSwatch 
              color={COLORS.gray.light} 
              label="Light" 
              hexCode="#A0A0A0"
            />
            <ColorSwatch 
              color={COLORS.gray.lighter} 
              label="Lighter" 
              hexCode="#F0F0F0"
            />
            <ColorSwatch 
              color={COLORS.gray.white} 
              label="White" 
              hexCode="#FFFFFF"
            />
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

