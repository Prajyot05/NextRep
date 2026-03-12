import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NextRep',
  slug: 'nextrep',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'nextrep',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#09090b',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.nextrep.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Used to take progress photos',
      NSPhotoLibraryUsageDescription: 'Used to select progress photos',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#09090b',
    },
    package: 'com.nextrep.app',
    versionCode: 1,
    permissions: ['CAMERA', 'READ_MEDIA_IMAGES'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: { newArchEnabled: true },
        android: { newArchEnabled: true },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
