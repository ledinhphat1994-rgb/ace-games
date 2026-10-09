import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.gdtxdinhquan.campus',
  appName: 'Digital Campus',
  webDir: 'dist/client',
  server: {
    url: 'https://gdtxdinhquan.com',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d14',
    },
  },
}

export default config
