package com.mantrapuja.official.alarm.utils;

import android.content.Context;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmHistoryEntity;
import java.util.UUID;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmAnalytics.kt */

/* loaded from: classes3.dex */
public final class AlarmAnalytics {
    public static final AlarmAnalytics INSTANCE = new AlarmAnalytics();

    private AlarmAnalytics() {
    }

    public final void logAlarmTrigger(final Context context, final String alarmId, final long scheduledTime, final long triggerTime, final String failureReason) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(alarmId, "alarmId");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.utils.AlarmAnalytics$$ExternalSyntheticLambda0
            @Override // java.lang.Runnable
            public final void run() {
                AlarmAnalytics.logAlarmTrigger$lambda$0(context, alarmId, scheduledTime, triggerTime, failureReason);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void logAlarmTrigger$lambda$0(Context context, String str, long j, long j2, String str2) {
        AlarmDatabase companion = AlarmDatabase.INSTANCE.getInstance(context);
        String uuid = UUID.randomUUID().toString();
        Intrinsics.checkNotNullExpressionValue(uuid, "toString(...)");
        companion.alarmHistoryDao().insertHistory(new AlarmHistoryEntity(uuid, str, j, j2, 0L, 0, 0L, false, false, str2, "5.0.0"));
    }
}
