import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.farmigo.app',
  appName: 'Farmigo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
