package com.mantrapuja.official.alarm.engine;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.utils.SolarCalculator;
import java.util.Calendar;
import java.util.Date;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmScheduler.kt */

/* loaded from: classes3.dex */
public final class AlarmScheduler {
    public static final AlarmScheduler INSTANCE = new AlarmScheduler();

    private final int getMaskForCalendarDay(int day) {
        switch (day) {
            case 1:
                return 1;
            case 2:
                return 2;
            case 3:
                return 4;
            case 4:
                return 8;
            case 5:
                return 16;
            case 6:
                return 32;
            case 7:
                return 64;
            default:
                return 0;
        }
    }

    private AlarmScheduler() {
    }

    public final void scheduleAlarm(final Context context, AlarmEntity alarm) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(alarm, "alarm");
        if (!alarm.getEnabled() || !alarm.isDownloaded()) {
            cancelAlarm(context, alarm.getId());
            return;
        }
        Object systemService = context.getSystemService(NotificationCompat.CATEGORY_ALARM);
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.app.AlarmManager");
        AlarmManager alarmManager = (AlarmManager) systemService;
        if (Build.VERSION.SDK_INT >= 31 && !alarmManager.canScheduleExactAlarms()) {
            Log.w("AlarmScheduler", "Cannot schedule exact alarm: exact alarm permission revoked!");
        }
        long calculateNextTriggerTime = calculateNextTriggerTime(alarm);
        Log.i("AlarmScheduler", "Scheduling alarm: " + alarm.getId() + " for time: " + calculateNextTriggerTime + " (" + new Date(calculateNextTriggerTime) + ")");
        final AlarmEntity copy$default = AlarmEntity.copy$default(alarm, null, null, null, null, false, 0, calculateNextTriggerTime, null, 0, false, 0.0f, 0, false, false, 0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, 0L, null, null, null, 0L, null, 268435391, null);
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmScheduler$$ExternalSyntheticLambda0
            @Override // java.lang.Runnable
            public final void run() {
                AlarmScheduler.scheduleAlarm$lambda$0(context, copy$default);
            }
        }).start();
        Intent intent = new Intent(context, (Class<?>) AlarmReceiver.class);
        intent.putExtra("alarm_id", alarm.getId());
        PendingIntent broadcast = PendingIntent.getBroadcast(context, alarm.getId().hashCode(), intent, 201326592);
        Intent intent2 = new Intent(context, (Class<?>) AlarmReceiver.class);
        intent2.putExtra("alarm_id", alarm.getId());
        intent2.putExtra("action", "SHOW_OVERLAY");
        alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(calculateNextTriggerTime, PendingIntent.getBroadcast(context, alarm.getId().hashCode() + 1, intent2, 201326592)), broadcast);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void scheduleAlarm$lambda$0(Context context, AlarmEntity alarmEntity) {
        AlarmDatabase.INSTANCE.getInstance(context).alarmDao().updateAlarm(alarmEntity);
    }

    public final void cancelAlarm(Context context, String id) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(id, "id");
        Object systemService = context.getSystemService(NotificationCompat.CATEGORY_ALARM);
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.app.AlarmManager");
        AlarmManager alarmManager = (AlarmManager) systemService;
        PendingIntent broadcast = PendingIntent.getBroadcast(context, id.hashCode(), new Intent(context, (Class<?>) AlarmReceiver.class), 603979776);
        if (broadcast != null) {
            alarmManager.cancel(broadcast);
            broadcast.cancel();
            Log.i("AlarmScheduler", "Cancelled alarm: " + id);
        }
    }

    private final long calculateNextTriggerTime(AlarmEntity alarm) {
        long currentTimeMillis = System.currentTimeMillis();
        Calendar calendar = Calendar.getInstance();
        if (Intrinsics.areEqual(alarm.getRepeatType(), "SUNRISE") || Intrinsics.areEqual(alarm.getRepeatType(), "SUNSET") || Intrinsics.areEqual(alarm.getRepeatType(), "MUHURTA")) {
            long calculateSolarEventTime = calculateSolarEventTime(alarm.getRepeatType(), alarm.getLatitude(), alarm.getLongitude());
            return calculateSolarEventTime > currentTimeMillis ? calculateSolarEventTime : calculateSolarEventTimeForTomorrow(alarm.getRepeatType(), alarm.getLatitude(), alarm.getLongitude());
        }
        Calendar calendar2 = Calendar.getInstance();
        calendar2.setTimeInMillis(alarm.getNextTrigger());
        calendar.set(11, calendar2.get(11));
        calendar.set(12, calendar2.get(12));
        calendar.set(13, 0);
        calendar.set(14, 0);
        if (calendar.getTimeInMillis() <= currentTimeMillis) {
            calendar.add(6, 1);
        }
        String repeatType = alarm.getRepeatType();
        switch (repeatType.hashCode()) {
            case 2430593:
                if (repeatType.equals("ONCE")) {
                    return alarm.getNextTrigger() > currentTimeMillis ? alarm.getNextTrigger() : calendar.getTimeInMillis();
                }
                break;
            case 64808441:
                if (repeatType.equals("DAILY")) {
                    return calendar.getTimeInMillis();
                }
                break;
            case 160654923:
                if (repeatType.equals("WEEKDAYS")) {
                    while (true) {
                        if (calendar.get(7) != 7 && calendar.get(7) != 1) {
                            return calendar.getTimeInMillis();
                        }
                        calendar.add(6, 1);
                    }
                }
                break;
            case 1999208305:
                if (repeatType.equals("CUSTOM")) {
                    for (int i = 7; i > 0; i--) {
                        if ((getMaskForCalendarDay(calendar.get(7)) & alarm.getWeekdaysMask()) != 0) {
                            return calendar.getTimeInMillis();
                        }
                        calendar.add(6, 1);
                    }
                    return calendar.getTimeInMillis();
                }
                break;
        }
        return calendar.getTimeInMillis();
    }

    private final long calculateSolarEventTime(String type, double lat, double lon) {
        Calendar calendar = Calendar.getInstance();
        SolarCalculator solarCalculator = SolarCalculator.INSTANCE;
        Intrinsics.checkNotNull(calendar);
        return solarCalculator.calculateSolarEvent(calendar, type, lat, lon);
    }

    private final long calculateSolarEventTimeForTomorrow(String type, double lat, double lon) {
        Calendar calendar = Calendar.getInstance();
        calendar.add(6, 1);
        SolarCalculator solarCalculator = SolarCalculator.INSTANCE;
        Intrinsics.checkNotNull(calendar);
        return solarCalculator.calculateSolarEvent(calendar, type, lat, lon);
    }
}
