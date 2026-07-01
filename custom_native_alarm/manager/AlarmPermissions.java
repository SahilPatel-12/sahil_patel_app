package com.mantrapuja.official.alarm.manager;

import android.app.AlarmManager;
import android.content.Context;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmPermissions.kt */

/* loaded from: classes3.dex */
public final class AlarmPermissions {
    public static final AlarmPermissions INSTANCE = new AlarmPermissions();

    private AlarmPermissions() {
    }

    public final boolean canScheduleExactAlarms(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        if (Build.VERSION.SDK_INT < 31) {
            return true;
        }
        Object systemService = context.getSystemService(NotificationCompat.CATEGORY_ALARM);
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.app.AlarmManager");
        return ((AlarmManager) systemService).canScheduleExactAlarms();
    }

    public final boolean areNotificationsEnabled(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    public final boolean canDrawOverlays(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        if (Build.VERSION.SDK_INT >= 23) {
            return android.provider.Settings.canDrawOverlays(context);
        }
        return true;
    }
}
