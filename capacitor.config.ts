import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.malek.sandok',
  appName: 'Sandok',
  webDir: 'dist',
  server: {
    url: 'https://7bba29c7-cee9-4573-8fc2-e68ff7f68488.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
