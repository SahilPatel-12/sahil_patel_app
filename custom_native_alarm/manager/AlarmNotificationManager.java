package com.mantrapuja.official.alarm.manager;

import android.R;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import com.mantrapuja.official.alarm.engine.AlarmActionReceiver;
import com.mantrapuja.official.alarm.ui.AlarmActivity;
import expo.modules.notifications.service.NotificationsService;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmNotificationManager.kt */

/* loaded from: classes3.dex */
public final class AlarmNotificationManager {
    public static final String CHANNEL_ALARM_RINGING = "alarm_ringing";
    public static final String CHANNEL_BACKGROUND_SERVICE = "background_service";
    public static final AlarmNotificationManager INSTANCE = new AlarmNotificationManager();

    private AlarmNotificationManager() {
    }

    public final void createNotificationChannels(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        if (Build.VERSION.SDK_INT >= 26) {
            Object systemService = context.getSystemService(NotificationsService.NOTIFICATION_KEY);
            Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.app.NotificationManager");
            NotificationManager notificationManager = (NotificationManager) systemService;
            NotificationChannel notificationChannel = new NotificationChannel(CHANNEL_ALARM_RINGING, "Devotional Alarms", 4);
            notificationChannel.setDescription("Plays full screen alarms and custom audio controls.");
            notificationChannel.setSound(null, null);
            notificationChannel.enableVibration(true);
            notificationManager.createNotificationChannel(notificationChannel);
            NotificationChannel notificationChannel2 = new NotificationChannel(CHANNEL_BACKGROUND_SERVICE, "Persistent Monitor", 1);
            notificationChannel2.setDescription("Low-priority background service indicator.");
            notificationManager.createNotificationChannel(notificationChannel2);
        }
    }

    public final Notification buildRingingNotification(Context context, String alarmId, String label) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(alarmId, "alarmId");
        Intrinsics.checkNotNullParameter(label, "label");
        createNotificationChannels(context);
        Intent intent = new Intent(context, (Class<?>) AlarmActivity.class);
        intent.putExtra("alarm_id", alarmId);
        intent.setFlags(268697600);
        PendingIntent activity = PendingIntent.getActivity(context, alarmId.hashCode(), intent, 201326592);
        Intent intent2 = new Intent(context, (Class<?>) AlarmActionReceiver.class);
        intent2.setAction("DISMISS");
        intent2.putExtra("alarm_id", alarmId);
        PendingIntent broadcast = PendingIntent.getBroadcast(context, alarmId.hashCode() + 10, intent2, 201326592);
        Intent intent3 = new Intent(context, (Class<?>) AlarmActionReceiver.class);
        intent3.setAction("SNOOZE");
        intent3.putExtra("alarm_id", alarmId);
        PendingIntent broadcast2 = PendingIntent.getBroadcast(context, alarmId.hashCode() + 20, intent3, 201326592);
        NotificationCompat.Builder contentTitle = new NotificationCompat.Builder(context, CHANNEL_ALARM_RINGING).setSmallIcon(R.drawable.ic_lock_idle_alarm).setContentTitle("Mantra Puja Devotional Alarm! 🌸");
        String str = label;
        if (str.length() == 0) {
            str = "Time for your devotional chant";
        }
        NotificationCompat.Builder addAction = contentTitle.setContentText(str).setPriority(1).setCategory(NotificationCompat.CATEGORY_ALARM).setAutoCancel(false).setOngoing(true).setFullScreenIntent(activity, true).setVisibility(1).addAction(R.drawable.ic_menu_close_clear_cancel, "Dismiss", broadcast).addAction(R.drawable.ic_menu_today, "Snooze (10m)", broadcast2);
        Intrinsics.checkNotNullExpressionValue(addAction, "addAction(...)");
        Notification build = addAction.build();
        Intrinsics.checkNotNullExpressionValue(build, "build(...)");
        return build;
    }
}
