package com.mantrapuja.official.alarm.engine;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.mantrapuja.official.alarm.db.AlarmDao;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.db.AlarmHistoryDao;
import com.mantrapuja.official.alarm.db.AlarmHistoryEntity;
import java.util.UUID;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmActionReceiver.kt */

/* loaded from: classes3.dex */
public final class AlarmActionReceiver extends BroadcastReceiver {
    @Override // android.content.BroadcastReceiver
    public void onReceive(final Context context, Intent intent) {
        final String stringExtra;
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(intent, "intent");
        final String action = intent.getAction();
        if (action == null || (stringExtra = intent.getStringExtra("alarm_id")) == null) {
            return;
        }
        Log.i("AlarmActionReceiver", "Action received: " + action + " for Alarm ID: " + stringExtra);
        context.stopService(new Intent(context, (Class<?>) AlarmService.class));
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmActionReceiver$$ExternalSyntheticLambda0
            @Override // java.lang.Runnable
            public final void run() {
                AlarmActionReceiver.onReceive$lambda$0(context, stringExtra, action);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void onReceive$lambda$0(Context context, String str, String str2) {
        AlarmDatabase companion = AlarmDatabase.INSTANCE.getInstance(context);
        AlarmDao alarmDao = companion.alarmDao();
        AlarmHistoryDao alarmHistoryDao = companion.alarmHistoryDao();
        AlarmEntity alarmById = alarmDao.getAlarmById(str);
        if (alarmById == null) {
            Log.e("AlarmActionReceiver", "Alarm ID " + str + " not found in database");
            return;
        }
        long currentTimeMillis = System.currentTimeMillis();
        if (Intrinsics.areEqual(str2, "SNOOZE")) {
            AlarmEntity copy$default = AlarmEntity.copy$default(alarmById, null, null, null, null, false, 0, currentTimeMillis + (alarmById.getSnoozeDuration() * 60 * 1000), null, 0, false, 0.0f, 0, false, false, 0, 0, 0L, alarmById.getTriggerCount() + 1, 0, 0.0d, 0.0d, 0L, currentTimeMillis, null, null, null, 0L, null, 264110015, null);
            alarmDao.updateAlarm(copy$default);
            AlarmScheduler.INSTANCE.scheduleAlarm(context, copy$default);
            Log.i("AlarmActionReceiver", "Alarm " + str + " snoozed for 10 minutes");
            String uuid = UUID.randomUUID().toString();
            Intrinsics.checkNotNullExpressionValue(uuid, "toString(...)");
            alarmHistoryDao.insertHistory(new AlarmHistoryEntity(uuid, str, alarmById.getNextTrigger(), currentTimeMillis, 0L, alarmById.getTriggerCount() + 1, (currentTimeMillis - alarmById.getLastTriggered()) / 1000, false, false, null, "5.0.0"));
            return;
        }
        if (Intrinsics.areEqual(str2, "DISMISS")) {
            boolean areEqual = Intrinsics.areEqual(alarmById.getRepeatType(), "ONCE");
            AlarmEntity copy$default2 = AlarmEntity.copy$default(alarmById, null, null, null, null, false, 0, 0L, null, 0, !areEqual, 0.0f, 0, false, false, 0, 0, currentTimeMillis, 0, 0, 0.0d, 0.0d, 0L, currentTimeMillis, null, null, null, 0L, null, 264044031, null);
            alarmDao.updateAlarm(copy$default2);
            if (!areEqual) {
                AlarmScheduler.INSTANCE.scheduleAlarm(context, copy$default2);
            } else {
                AlarmScheduler.INSTANCE.cancelAlarm(context, str);
            }
            Log.i("AlarmActionReceiver", "Alarm " + str + " dismissed successfully");
            String uuid2 = UUID.randomUUID().toString();
            Intrinsics.checkNotNullExpressionValue(uuid2, "toString(...)");
            alarmHistoryDao.insertHistory(new AlarmHistoryEntity(uuid2, str, alarmById.getNextTrigger(), currentTimeMillis, currentTimeMillis, 0, (currentTimeMillis - alarmById.getLastTriggered()) / 1000, true, false, null, "5.0.0"));
        }
    }
}
