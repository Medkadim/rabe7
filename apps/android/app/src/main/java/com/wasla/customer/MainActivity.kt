package com.wasla.customer

import android.annotation.SuppressLint
import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

// A thin native shell around the Wasla storefront web app — every screen
// customers see is the same Next.js app served over the network, not
// reimplemented here. Kept to platform APIs only (no AndroidX) since this
// gets built by a CI runner with no local way to iterate on it.
class MainActivity : Activity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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
        }
        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(baseUrl)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
