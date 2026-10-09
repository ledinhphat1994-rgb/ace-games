import React, { useRef, useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  SafeAreaView,
} from 'react-native'
import { WebView, type WebViewNavigation } from 'react-native-webview'

const WEB_URL = 'https://gdtxdinhquan.com'

export default function App() {
  const webViewRef = useRef<any>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
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

      {/* Màn hình tải (Loading Splash) sang trọng ban đầu */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>DIGITAL CAMPUS</Text>
          <Text style={styles.loadingSubtitle}>GDTX Định Quán · Lớp 10A7</Text>
          <ActivityIndicator size="large" color="#38bdf8" style={styles.spinner} />
        </View>
      )}
    </SafeAreaView>
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
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
})
