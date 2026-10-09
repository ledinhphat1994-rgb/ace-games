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

const WEB_URL = 'https://gdtxdinhquan.com'

export default function App() {
  const webViewRef = useRef<any>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
          // Bật tối đa tăng tốc phần cứng GPU (Hardware Acceleration)
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          // Cho phép lưu cache và LocalStorage / Cookies phiên đăng nhập
          domStorageEnabled={true}
          databaseEnabled={true}
          cacheEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // Cho phép phát âm thanh / media game và video YouTube lớp học
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          // Tối ưu trải nghiệm cảm ứng và cuộn trang
          overScrollMode="never"
          textZoom={100}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          // User Agent tối ưu Chrome Mobile
          applicationNameForUserAgent="DigitalCampusApp/1.0.0"
        />

        {/* Màn hình Splash Loading sang trọng mang Logo App đồng bộ */}
        {isLoading && (
          <View style={styles.loadingContainer} pointerEvents="none">
            <Image
              source={require('./assets/android-icon-foreground.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.loadingTitle}>DIGITAL CAMPUS</Text>
            <Text style={styles.loadingSubtitle}>GDTX Định Quán · Lớp 10A7</Text>
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
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  loadingTitle: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '900',
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
