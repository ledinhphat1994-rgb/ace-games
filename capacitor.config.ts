import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.acegames.app',
  appName: 'Ace Games',
  webDir: 'dist/client',
  server: {
    url: 'https://gdtxdinhquan.com',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020c24',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    hideLogs: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
}

export default config
