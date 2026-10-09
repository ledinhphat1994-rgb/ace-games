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
          injectedJavaScriptBeforeContentLoaded={INJECTED_FAST_TOUCH_JS}
          // Bật tối đa tăng tốc phần cứng GPU (Hardware Acceleration)
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          renderToHardwareTextureAndroid={true}
          // Cho phép lưu cache và LocalStorage / Cookies phiên đăng nhập
          domStorageEnabled={true}
          databaseEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          setSupportMultipleWindows={false}
          // Cho phép phát âm thanh / media game và video YouTube lớp học
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          keyboardDisplayRequiresUserAction={false}
          // Tối ưu trải nghiệm cảm ứng và tốc độ phản hồi 60-120fps
          overScrollMode="never"
          bounces={false}
          pullToRefreshEnabled={false}
          decelerationRate="normal"
          directionalLockEnabled={true}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          textZoom={100}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          allowsBackForwardNavigationGestures={true}
          // User Agent tối ưu Chrome Mobile
          applicationNameForUserAgent="DigitalCampusApp/1.0.0"
        />

        {/* Màn hình Splash Loading sang trọng mang Logo App đồng bộ to rõ */}
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
    width: 96,
    height: 96,
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
