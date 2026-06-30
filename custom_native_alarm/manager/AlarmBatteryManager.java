package com.mantrapuja.official.alarm.manager;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmBatteryManager.kt */

/* loaded from: classes3.dex */
public final class AlarmBatteryManager {
    public static final AlarmBatteryManager INSTANCE = new AlarmBatteryManager();

    private AlarmBatteryManager() {
    }

    public final boolean isBatteryOptimizationIgnored(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        Object systemService = context.getSystemService("power");
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.os.PowerManager");
        return ((PowerManager) systemService).isIgnoringBatteryOptimizations(context.getPackageName());
    }

    public final void requestBatteryOptimizationWaiver(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        if (isBatteryOptimizationIgnored(context)) {
            return;
        }
        Intent intent = new Intent("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
        intent.setData(Uri.parse("package:" + context.getPackageName()));
        intent.setFlags(268435456);
        try {
            context.startActivity(intent);
        } catch (Exception unused) {
            Intent intent2 = new Intent("android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS");
            intent2.setFlags(268435456);
            context.startActivity(intent2);
        }
    }
}
