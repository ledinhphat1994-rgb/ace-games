import React, { useRef, useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  Image,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import * as Haptics from 'expo-haptics'

const WEB_URL = 'https://gdtxdinhquan.com/arena'

export default function App() {
  const webViewRef = useRef<any>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Xử lý thông điệp từ Web Game gửi lên Native Shell qua Native Bridge
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'haptic') {
        switch (data.pattern) {
          case 'selection':
            Haptics.selectionAsync().catch(() => {})
            break
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            break
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
            break
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
            break
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
            break
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
            break
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
            break
        }
      }
    } catch {}
  }, [])

  // Khóa an toàn: Tự động tắt loading splash sau tối đa 2.2 giây để không bao giờ bị kẹt
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      setIsLoading(false)
    }, 2200)
    return () => clearTimeout(failsafeTimer)
  }, [])

  // Xử lý nút Back phần cứng của Android để điều hướng trong WebView mượt mà
  const handleBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack()
      return true
    }
    return false
  }, [canGoBack])

  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      )
      return () => subscription.remove()
    }
  }, [handleBackPress])

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack)
  }

  // Tắt loading sớm khi trang nạp được từ 60% trở lên
  const handleLoadProgress = ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
    if (nativeEvent.progress >= 0.6) {
      setIsLoading(false)
    }
  }

  // Đoạn script tiêm trước khi nạp DOM để triệt tiêu 300ms touch delay, kích hoạt 120Hz mượt mà
  const INJECTED_FAST_TOUCH_JS = `
    (function() {
      try {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(
          '* { -webkit-tap-highlight-color: transparent !important; } ' +
          'html, body { touch-action: manipulation; -webkit-overflow-scrolling: touch; }'
        ));
        if (document.head) {
          document.head.appendChild(style);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            document.head.appendChild(style);
          });
        }
      } catch (e) {}
      true;
    })();
    true;
  `

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadProgress={handleLoadProgress}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          onHttpError={() => setIsLoading(false)}
          onMessage={handleWebViewMessage}
          injectedJavaScriptBeforeContentLoaded={INJECTED_FAST_TOUCH_JS}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          androidLayerType="hardware"
          nestedScrollEnabled={true}
          textZoom={100}
          scalesPageToFit={false}
          setSupportMultipleWindows={false}
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          thirdPartyCookiesEnabled={true}
          applicationNameForUserAgent="AceGamesApp/1.0.0"
        />

        {/* Màn hình Splash Loading sang trọng mang Logo App đồng bộ to rõ */}
        {isLoading && (
          <View style={styles.loadingContainer} pointerEvents="none">
            <Image
              source={require('./assets/android-icon-foreground.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.loadingTitle}>ACE GAMES</Text>
            <Text style={styles.loadingSubtitle}>Đấu Trường Game Mobile</Text>
            <ActivityIndicator size="small" color="#38bdf8" style={styles.spinner} />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c24',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020c24',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020c24',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  loadingTitle: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  loadingSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 4,
  },
})
