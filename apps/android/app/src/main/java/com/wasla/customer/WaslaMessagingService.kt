package com.wasla.customer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// Handles FCM token refresh and foreground push delivery for "new
// product"/"new promotion" alerts. Background/killed delivery needs no code
// here at all — the OS shows a system-tray notification automatically for
// any message carrying a "notification" payload (which the backend always
// sends, see NotificationsService.sendPush), the same field that makes
// ordinary web push work when a browser tab isn't open. Only the foreground
// case — the app already active on screen — skips that automatic display,
// so this class builds one manually for that one case.
class WaslaMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        TokenBridge.pendingToken = token
        TokenBridge.deliver()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val notification = message.notification ?: return
        val channelId = "waslak_alerts"
        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(channelId, "تنبيهات وصلة", NotificationManager.IMPORTANCE_DEFAULT),
            )
        }
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(notification.title)
            .setContentText(notification.body)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
        manager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}
