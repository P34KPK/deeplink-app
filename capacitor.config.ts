import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deeplink.app',
  appName: 'DeepLink',
  webDir: 'out',
  server: {
    // 🚀 IMPORTANT: Replace this url with your deployed website URL (e.g. https://your-project.vercel.app)
    // The mobile app will load this URL.
    // url: 'https://deeplink.vercel.app', 
    androidScheme: 'https'
  }
};

export default config;
