import * as React from 'react';
import { View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import ENV from '@/lib/config';

export function EnvironmentBadge() {
  if (ENV.isProduction) {
    return null; // Don't show badge in production
  }

  return (
    <View className="absolute top-2 right-2 z-50">
      <Badge variant="default" className="bg-warning">
        <Text className="text-xs font-bold text-black">
          {ENV.environment.toUpperCase()}
        </Text>
      </Badge>
    </View>
  );
}

interface EnvironmentInfoProps {
  showDetails?: boolean;
}

export function EnvironmentInfo({ showDetails = false }: EnvironmentInfoProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-semibold">Environment:</Text>
        <Badge variant={ENV.isStaging ? 'default' : 'secondary'}>
          <Text className="text-xs font-bold">
            {ENV.environment.toUpperCase()}
          </Text>
        </Badge>
      </View>
      
      {showDetails && (
        <>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted-foreground">API URL:</Text>
            <Text className="text-xs font-mono">{ENV.apiUrl}</Text>
          </View>
          
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted-foreground">Debug Mode:</Text>
            <Text className="text-xs">
              {ENV.enableDebugMode ? '✅ Enabled' : '❌ Disabled'}
            </Text>
          </View>
          
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted-foreground">Analytics:</Text>
            <Text className="text-xs">
              {ENV.enableAnalytics ? '✅ Enabled' : '❌ Disabled'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

