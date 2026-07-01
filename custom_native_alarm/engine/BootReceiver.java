package com.mantrapuja.official.alarm.engine;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import java.util.List;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: BootReceiver.kt */

/* loaded from: classes3.dex */
public final class BootReceiver extends BroadcastReceiver {
    @Override // android.content.BroadcastReceiver
    public void onReceive(final Context context, Intent intent) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(intent, "intent");
        if (Intrinsics.areEqual(intent.getAction(), "android.intent.action.BOOT_COMPLETED")) {
            Log.i("BootReceiver", "Device reboot detected! Rescheduling alarms...");
            new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.BootReceiver$$ExternalSyntheticLambda0
                @Override // java.lang.Runnable
                public final void run() {
                    BootReceiver.onReceive$lambda$0(context);
                }
            }).start();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void onReceive$lambda$0(Context context) {
        AlarmDatabase db = AlarmDatabase.INSTANCE.getInstance(context);
        List<AlarmEntity> enabledAlarms = db.alarmDao().getEnabledAlarms();
        Log.i("BootReceiver", "Found " + enabledAlarms.size() + " active alarms to restore");
        for (AlarmEntity alarmEntity : enabledAlarms) {
            try {
                AlarmScheduler.INSTANCE.scheduleAlarm(context, alarmEntity);
                Log.i("BootReceiver", "Successfully restored alarm: " + alarmEntity.getId());
            } catch (Exception e) {
                Log.e("BootReceiver", "Failed to schedule alarm: " + alarmEntity.getId() + " on boot", e);
            }
        }

        // Recover interrupted / pending downloads on boot
        try {
            List<AlarmEntity> pendingAlarms = db.alarmDao().getPendingAlarms();
            for (AlarmEntity alarm : pendingAlarms) {
                if (alarm.getEnabled() && alarm.getDownloadUrl() != null && !alarm.getDownloadUrl().isEmpty()) {
                    com.mantrapuja.official.alarm.manager.AlarmDownloadManager.INSTANCE.enqueueDownload(context, alarm.getMusicId(), alarm.getDownloadUrl(), alarm.getMd5());
                }
            }
        } catch (Exception e) {
            Log.e("BootReceiver", "Failed to recover pending downloads on boot", e);
        }
    }
}
