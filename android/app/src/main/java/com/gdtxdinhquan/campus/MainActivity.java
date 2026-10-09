package com.gdtxdinhquan.campus;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Bật tăng tốc phần cứng Window GPU 60-120Hz
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Ép WebView dùng tầng phần cứng GPU (Hardware Layer)
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

                WebSettings settings = webView.getSettings();
                // Bật bộ nhớ đệm Cache tối ưu để không bị giật lag khi tải tài nguyên
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);

                // Tăng tốc vẽ nội dung và render
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                settings.setOffscreenPreRaster(true);

                // Tối ưu cuộn và phản hồi cảm ứng
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
            }
        } catch (Exception e) {
            // Safe fallback
        }
    }
}
