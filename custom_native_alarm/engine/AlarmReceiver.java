package com.mantrapuja.official.alarm.engine;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmReceiver.kt */

/* loaded from: classes3.dex */
public final class AlarmReceiver extends BroadcastReceiver {
    @Override // android.content.BroadcastReceiver
    public void onReceive(Context context, Intent intent) {
        ComponentName startService;
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(intent, "intent");
        String stringExtra = intent.getStringExtra("alarm_id");
        if (stringExtra == null) {
            return;
        }
        Log.i("AlarmReceiver", "Alarm trigger received for ID: " + stringExtra);
        Intent intent2 = new Intent(context, (Class<?>) AlarmService.class);
        intent2.putExtra("alarm_id", stringExtra);
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                startService = context.startForegroundService(intent2);
            } else {
                startService = context.startService(intent2);
            }
            ComponentName componentName = startService;
        } catch (Exception e) {
            Log.e("AlarmReceiver", "Failed to start AlarmService", e);
        }
    }
}
