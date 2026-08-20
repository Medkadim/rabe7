package com.wasla.customer

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject

// A thin native shell around the Wasla storefront web app — every screen
// customers see is the same Next.js app served over the network, not
// reimplemented here. Kept to platform APIs only (no AndroidX) since this
// gets built by a CI runner with no local way to iterate on it.
class MainActivity : Activity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }

        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        val baseUrl = getString(R.string.base_url)
        val baseHost = Uri.parse(baseUrl).host

        webView.webViewClient = object : WebViewClient() {
            // Keep navigation inside the app for the storefront's own
            // pages; anything pointing elsewhere (a future payment
            // provider redirect, a support link) opens in the phone's
            // regular browser instead of getting trapped in this WebView.
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val host = Uri.parse(url).host
                if (host != null && host != baseHost) {
                    startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
                return false
            }

            // The page needs to have loaded (and run its own JS) before it
            // can define window.__wasla_registerFcmToken — see
            // deliverFcmTokenIfReady().
            override fun onPageFinished(view: WebView, url: String) {
                deliverFcmTokenIfReady()
            }
        }
        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(baseUrl)
    }

    override fun onResume() {
        super.onResume()
        TokenBridge.activity = this
        deliverFcmTokenIfReady()
    }

    override fun onPause() {
        if (TokenBridge.activity === this) TokenBridge.activity = null
        super.onPause()
    }

    // Hands the FCM token (once one exists — see WaslaMessagingService) to
    // the storefront web app, which already knows how to register a device
    // token with the backend for the signed-in customer (the same call the
    // web-push path uses — see use-push-notifications.ts) — this just gives
    // it a native token instead of a browser-generated one.
    fun deliverFcmTokenIfReady() {
        val token = TokenBridge.pendingToken ?: return
        val script = "window.__wasla_registerFcmToken && window.__wasla_registerFcmToken(${JSONObject.quote(token)});"
        webView.post { webView.evaluateJavascript(script, null) }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
