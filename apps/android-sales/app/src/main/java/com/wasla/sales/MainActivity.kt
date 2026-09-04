package com.wasla.sales

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

// A thin native shell around the Wasla sales (prevente) web app — every
// screen a rep sees is the same Next.js app served over the network, not
// reimplemented here. Kept to platform APIs only (no AndroidX) since this
// gets built by a CI runner with no local way to iterate on it.
class MainActivity : Activity() {
    private lateinit var webView: WebView

    // A page's navigator.geolocation.getCurrentPosition() call (the
    // "recruit a new client" screen's "current location" button) surfaces
    // here as onGeolocationPermissionsShowPrompt — held until the runtime
    // permission dialog resolves, then answered either way.
    private var pendingGeoOrigin: String? = null
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null

    // The "recruit a new client" screen's premises-photo <input type="file">
    // needs this too — a bare WebView doesn't wire file inputs to anything,
    // so without it "Choose File" would just do nothing.
    private var pendingFileCallback: ValueCallback<Array<Uri>>? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false
        webView.settings.setGeolocationEnabled(true)

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        val baseUrl = getString(R.string.base_url)
        val baseHost = Uri.parse(baseUrl).host

        webView.webViewClient = object : WebViewClient() {
            // Keep navigation inside the app for the sales app's own
            // pages; anything pointing elsewhere (e.g. a maps link, a
            // support link) opens in the phone's regular browser instead
            // of getting trapped in this WebView.
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val host = Uri.parse(url).host
                if (host != null && host != baseHost) {
                    startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
                return false
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback,
            ) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false)
                    return
                }
                pendingGeoOrigin = origin
                pendingGeoCallback = callback
                requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), GEO_PERMISSION_REQUEST_CODE)
            }

            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams,
            ): Boolean {
                pendingFileCallback?.onReceiveValue(null)
                pendingFileCallback = filePathCallback
                val intent = fileChooserParams.createIntent()
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE)
                } catch (e: android.content.ActivityNotFoundException) {
                    pendingFileCallback = null
                    return false
                }
                return true
            }
        }

        webView.loadUrl(baseUrl)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val results = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            pendingFileCallback?.onReceiveValue(results)
            pendingFileCallback = null
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    private fun hasLocationPermission(): Boolean =
        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != GEO_PERMISSION_REQUEST_CODE) return

        val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        pendingGeoOrigin?.let { origin -> pendingGeoCallback?.invoke(origin, granted, false) }
        pendingGeoOrigin = null
        pendingGeoCallback = null
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    companion object {
        private const val GEO_PERMISSION_REQUEST_CODE = 1001
        private const val FILE_CHOOSER_REQUEST_CODE = 1002
    }
}
