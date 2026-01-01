# Mobile App

Cross-platform mobile application for Pingclub built with React Native and Expo.

> **Part of Pingclub Monorepo** - See [Monorepo Documentation](../../docs/README.md) for overall architecture.

## 🚀 Tech Stack

- **Framework:** React Native 0.81.5
- **Platform:** Expo SDK 54
- **Navigation:** Expo Router (file-based)
- **UI Components:** RN Primitives
- **Styling:** NativeWind (Tailwind for React Native)
- **Design System:** @pingclub/mobile-ui
- **Language:** TypeScript

## 📱 Multi-Environment Setup

The app supports **2 environments** that can be installed side-by-side on the same device:

### Staging Environment
- **App Name:** PINGCLUB (Staging)
- **iOS Bundle ID:** `com.pingclubapp.staging`
- **Android Package:** `com.pingclubapp.staging`
- **Icon:** Yellow badge
- **API URL:** `https://api-staging.pingclub.com`
- **Debug:** Enabled
- **Analytics:** Disabled

### Production Environment
- **App Name:** PINGCLUB
- **iOS Bundle ID:** `com.pingclubapp.prod`
- **Android Package:** `com.pingclubapp.prod`
- **Icon:** Standard icon
- **API URL:** `https://api.pingclub.com`
- **Debug:** Disabled
- **Analytics:** Enabled

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn package manager
- Xcode (for iOS development)
- Android Studio (for Android development)
- Expo CLI

### Installation

```bash
# From monorepo root
cd /Users/hipages/Projects/pingclub
yarn install
```

### Running the App

#### Staging Environment

```bash
# iOS
yarn ios:staging

# Android
yarn android:staging

# Expo Dev Client
yarn dev:staging
```

#### Production Environment

```bash
# iOS
yarn ios:prod

# Android  
yarn android:prod

# Expo Dev Client
yarn dev:prod
```

#### Default (Production)

```bash
# Default commands use production
yarn dev
yarn ios
yarn android
```

### First Time Setup

```bash
# 1. Build staging
yarn prebuild:staging
yarn ios:staging

# 2. Build production
yarn prebuild:prod
yarn ios:prod
```

## 📁 Project Structure

```
apps/mobile-app/
├── app/                       # Expo Router (file-based routing)
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # Home screen
│   └── design-system.tsx     # Design system showcase
│
├── components/
│   ├── ui/                   # RN Primitives components
│   ├── AnimatedSplash.tsx
│   ├── ColorPalette.tsx
│   └── EnvironmentBadge.tsx  # Environment indicator
│
├── lib/
│   ├── config.ts             # Environment configuration
│   ├── theme.ts              # Theme setup
│   └── utils.ts              # Utilities
│
├── assets/
│   └── images/
│       ├── icon.png          # Production icon
│       ├── icon-staging.png  # Staging icon
│       └── ...
│
├── android/                  # Native Android code
├── ios/                      # Native iOS code
├── app.config.js             # Expo configuration
├── tailwind.config.js        # NativeWind config
└── package.json
```

## 🎨 Design System

Uses shared design tokens from `@pingclub/mobile-ui`:

```typescript
import { COLORS } from '@pingclub/mobile-ui/tokens';

// In React Native
<View style={{ backgroundColor: COLORS.primary.main }}>
  <Text style={{ color: COLORS.gray.white }}>Hello</Text>
</View>

// With NativeWind
<View className="bg-primary-main">
  <Text className="text-white">Hello</Text>
</View>
```

**Design Tokens:**
- **Colors:** Primary (Purple), Secondary (Orange), Accent, Grayscale
- **Typography:** Font sizes, line heights
- **Spacing:** 8px grid system
- **Border Radius:** sm, md, lg, xl, full

See [@pingclub/mobile-ui](../../packages/mobile-ui/README.md) for details.

## ⚙️ Environment Configuration

### app.config.js

Auto-switches config based on `APP_ENV` environment variable:

```javascript
const IS_STAGING = process.env.APP_ENV === 'staging';

export default {
  name: IS_STAGING ? 'PINGCLUB (Staging)' : 'PINGCLUB',
  slug: IS_STAGING ? 'pingclub-staging' : 'pingclub-prod',
  ios: {
    bundleIdentifier: IS_STAGING 
      ? 'com.pingclubapp.staging' 
      : 'com.pingclubapp.prod',
  },
  android: {
    package: IS_STAGING 
      ? 'com.pingclubapp.staging' 
      : 'com.pingclubapp.prod',
  },
  extra: {
    environment: IS_STAGING ? 'staging' : 'production',
    apiUrl: IS_STAGING 
      ? 'https://api-staging.pingclub.com' 
      : 'https://api.pingclub.com',
  },
};
```

### lib/config.ts

Access environment in code:

```typescript
import ENV from '@/lib/config';

console.log(ENV.environment);  // 'staging' or 'production'
console.log(ENV.apiUrl);       // API endpoint
console.log(ENV.isStaging);    // boolean
console.log(ENV.isProduction); // boolean
```

### Adding Environment Variables

In `app.config.js`, add to `extra`:

```javascript
extra: {
  environment: IS_STAGING ? 'staging' : 'production',
  apiUrl: IS_STAGING ? 'https://api-staging.pingclub.com' : 'https://api.pingclub.com',
  // Add new config here
  googleMapsApiKey: IS_STAGING ? 'STAGING_KEY' : 'PRODUCTION_KEY',
  sentryDsn: IS_STAGING ? 'STAGING_DSN' : 'PRODUCTION_DSN',
}
```

In `lib/config.ts`:

```typescript
const ENV: AppConfig = {
  // ... existing config
  googleMapsApiKey: extra.googleMapsApiKey || '',
  sentryDsn: extra.sentryDsn || '',
};
```

## 🎨 App Icons

### Current Icons

- `assets/images/icon.png` - Production icon (1024x1024)
- `assets/images/icon-staging.png` - Staging icon (1024x1024)
- `assets/images/adaptive-icon.png` - Production Android icon
- `assets/images/adaptive-icon-staging.png` - Staging Android icon

### Customizing Staging Icon

To differentiate staging app:

1. Add "STG" or "STAGING" badge to icon
2. Change background color (e.g., yellow instead of purple)
3. Desaturate or add overlay

**Tools:**
- Online: https://www.appicon.co/
- Photoshop/Figma
- ImageMagick (CLI)

**Sizes:**
- `icon.png`: 1024x1024 px
- `adaptive-icon.png`: 1024x1024 px (Android safe zone: 66%)

## 📦 Available Scripts

```bash
# Development
yarn dev              # Dev with production config
yarn dev:staging      # Dev with staging config
yarn dev:prod         # Dev with production config

# iOS
yarn ios              # Run iOS (production)
yarn ios:staging      # Run iOS staging
yarn ios:prod         # Run iOS production

# Android
yarn android          # Run Android (production)
yarn android:staging  # Run Android staging
yarn android:prod     # Run Android production

# Prebuild (regenerate native folders)
yarn prebuild:staging # Rebuild staging
yarn prebuild:prod    # Rebuild production

# Utilities
yarn clean            # Clean builds
yarn type-check       # TypeScript check
```

## 🧩 Components

### EnvironmentBadge

Shows environment indicator (staging only):

```tsx
import { EnvironmentBadge } from '@/components/EnvironmentBadge';

<View>
  <EnvironmentBadge />
  {/* Your content */}
</View>
```

### EnvironmentInfo

Shows detailed environment information:

```tsx
import { EnvironmentInfo } from '@/components/EnvironmentBadge';

<Card>
  <CardContent>
    <EnvironmentInfo showDetails />
  </CardContent>
</Card>
```

## 🔧 Development Workflow

### Adding New Screens

```bash
# Create new screen in app directory
touch app/profile.tsx
```

```tsx
// app/profile.tsx
import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl">Profile</Text>
    </View>
  );
}
```

### Adding UI Components

```bash
# Add RN Primitives components
npx react-native-reusables/cli@latest add [component]

# Example:
npx react-native-reusables/cli@latest add button
npx react-native-reusables/cli@latest add card
```

### Using Design System

```tsx
import { COLORS } from '@pingclub/mobile-ui/tokens';
import { View, Text } from 'react-native';

// Direct styling
<View style={{ backgroundColor: COLORS.primary.main }}>
  <Text style={{ color: COLORS.gray.white }}>Hello</Text>
</View>

// With NativeWind
<View className="bg-primary-main p-4">
  <Text className="text-white text-lg">Hello</Text>
</View>
```

### After Adding Native Modules

```bash
# Rebuild native folders
yarn prebuild:staging  # or prebuild:prod
yarn ios:staging       # or ios:prod
```

## ✅ Pre-Release Checklist

### Staging Build
- [ ] Run `yarn prebuild:staging`
- [ ] Test on iOS: `yarn ios:staging`
- [ ] Test on Android: `yarn android:staging`
- [ ] Verify "STAGING" badge shows
- [ ] Verify API calls to staging endpoint
- [ ] Test core features

### Production Build
- [ ] Run `yarn prebuild:prod`
- [ ] Test on iOS: `yarn ios:prod`
- [ ] Test on Android: `yarn android:prod`
- [ ] Verify NO environment badge
- [ ] Verify API calls to production endpoint
- [ ] Verify analytics enabled
- [ ] Final testing

## 🐛 Troubleshooting

### Icon not changing

```bash
# Clear cache and rebuild
rm -rf .expo ios android
yarn prebuild:staging  # or prebuild:prod
yarn ios:staging       # or ios:prod
```

### Two apps have same bundle ID

Check `app.config.js` ensures:
- `bundleIdentifier` (iOS) is different
- `package` (Android) is different

### Environment variables not working

```bash
# Ensure running with correct prefix
APP_ENV=staging yarn dev

# Or use provided scripts
yarn dev:staging
```

### Native modules not updating

```bash
# Must rebuild native folders
yarn prebuild:staging  # or prebuild:prod
```

### Metro bundler cache issues

```bash
# Clear Metro cache
yarn start --clear

# Or
rm -rf node_modules/.cache
```

## 📱 Building for Production

### Expo EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for staging
eas build --profile staging --platform all

# Build for production
eas build --profile production --platform all
```

### Local Builds

```bash
# iOS
yarn prebuild:prod
cd ios
pod install
open PINGCLUBProduction.xcworkspace

# Android
yarn prebuild:prod
cd android
./gradlew assembleRelease
```

## 🎯 Best Practices

1. **Always test both environments** before release
2. **Use staging for testing new features**
3. **Never deploy staging to App Store/Play Store**
4. **Keep staging and production icons different**
5. **Log environment info on app start** (already implemented)
6. **Use feature flags** for experimental features

## 📚 Documentation

- [Monorepo Structure](../../docs/technical/monorepo-structure.md)
- [Design System](../../docs/technical/design-system.md)
- [Expo Docs](https://docs.expo.dev/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [RN Primitives](https://reactnativereusables.com)

## 🔗 Related Packages

- `@pingclub/mobile-ui` - Mobile design system

## 📱 Features

- ⚛️ Built with Expo Router (file-based routing)
- 🎨 Styled with Tailwind CSS via NativeWind
- 📦 UI powered by RN Primitives
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web
- 🌍 Multi-environment support
- 🎨 Shared design system

---

**Staging Bundle ID:** com.pingclubapp.staging  
**Production Bundle ID:** com.pingclubapp.prod  
**Design System:** @pingclub/mobile-ui
