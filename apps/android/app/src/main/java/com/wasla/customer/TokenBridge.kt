package com.wasla.customer

// Hands an FCM token from WaslaMessagingService (a system-instantiated
// component with no reference to the running Activity) over to whichever
// MainActivity instance is currently alive, so it can inject the token into
// the WebView's JS — see MainActivity.deliverFcmTokenIfReady().
object TokenBridge {
    @Volatile
    var pendingToken: String? = null

    @Volatile
    var activity: MainActivity? = null

    fun deliver() {
        activity?.deliverFcmTokenIfReady()
    }
}
