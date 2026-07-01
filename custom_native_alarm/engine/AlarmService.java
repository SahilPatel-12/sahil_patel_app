package com.mantrapuja.official.alarm.engine;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.work.PeriodicWorkRequest;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.manager.AlarmNotificationManager;
import com.mantrapuja.official.alarm.ui.AlarmActivity;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmService.kt */

/* loaded from: classes3.dex */
public final class AlarmService extends Service {
    private String activeAlarmId;
    private AlarmPlayer alarmPlayer;
    private PowerManager.WakeLock wakeLock;

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        this.alarmPlayer = new AlarmPlayer(this);
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int flags, int startId) {
        final String stringExtra;
        if (intent == null || (stringExtra = intent.getStringExtra("alarm_id")) == null) {
            return 2;
        }
        this.activeAlarmId = stringExtra;
        Log.i("AlarmService", "Starting alarm playback service for ID: " + stringExtra);
        Object systemService = getSystemService("power");
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.os.PowerManager");
        final PowerManager powerManager = (PowerManager) systemService;
        PowerManager.WakeLock newWakeLock = powerManager.newWakeLock(268435457, "MantraPuja::AlarmServiceWakeLock");
        newWakeLock.acquire(PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS);
        this.wakeLock = newWakeLock;
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmService$$ExternalSyntheticLambda0
            @Override // java.lang.Runnable
            public final void run() {
                AlarmService.onStartCommand$lambda$2(AlarmService.this, stringExtra, powerManager);
            }
        }).start();
        return 1;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void onStartCommand$lambda$2(AlarmService alarmService, String str, PowerManager powerManager) {
        AlarmService alarmService2 = alarmService;
        AlarmEntity alarmById = AlarmDatabase.INSTANCE.getInstance(alarmService2).alarmDao().getAlarmById(str);
        if (alarmById == null) {
            Log.e("AlarmService", "Alarm database record not found for ID: " + str);
            alarmService.stopSelf();
            return;
        }
        Notification buildRingingNotification = AlarmNotificationManager.INSTANCE.buildRingingNotification(alarmService2, alarmById.getId(), alarmById.getLabel());
        if (Build.VERSION.SDK_INT >= 29) {
            alarmService.startForeground(str.hashCode(), buildRingingNotification, 2);
        } else {
            alarmService.startForeground(str.hashCode(), buildRingingNotification);
        }
        AlarmPlayer alarmPlayer = alarmService.alarmPlayer;
        if (alarmPlayer != null) {
            alarmPlayer.play(alarmById.getLocalFilePath(), alarmById.getVolume(), alarmById.getFadeInDuration());
        }
        Intent intent = new Intent(alarmService2, (Class<?>) AlarmActivity.class);
        intent.putExtra("alarm_id", alarmById.getId());
        intent.setFlags(335544320);
        try {
            alarmService.startActivity(intent);
        } catch (Exception e) {
            Log.e("AlarmService", "Failed to start AlarmActivity UI directly", e);
        }
    }

    @Override // android.app.Service
    public void onDestroy() {
        PowerManager.WakeLock wakeLock;
        super.onDestroy();
        AlarmPlayer alarmPlayer = this.alarmPlayer;
        if (alarmPlayer != null) {
            alarmPlayer.stop();
        }
        this.alarmPlayer = null;
        PowerManager.WakeLock wakeLock2 = this.wakeLock;
        if (wakeLock2 != null && wakeLock2.isHeld() && (wakeLock = this.wakeLock) != null) {
            wakeLock.release();
        }
        Log.i("AlarmService", "AlarmService destroyed");
    }
}
