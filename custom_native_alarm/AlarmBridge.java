package com.mantrapuja.official.alarm;

import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.ViewProps;

import com.mantrapuja.official.alarm.db.AlarmDao;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.engine.AlarmScheduler;
import com.mantrapuja.official.alarm.manager.AlarmBatteryManager;
import com.mantrapuja.official.alarm.manager.AlarmDownloadManager;
import com.mantrapuja.official.alarm.manager.AlarmPermissions;
import java.util.List;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;
import org.json.JSONObject;

/* compiled from: AlarmBridge.kt */

/* loaded from: classes3.dex */
public final class AlarmBridge extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    /* JADX WARN: 'super' call moved to the top of the method (can break code semantics) */
    public AlarmBridge(final ReactApplicationContext reactContext) {
        super(reactContext);
        Intrinsics.checkNotNullParameter(reactContext, "reactContext");
        this.reactContext = reactContext;

        // Startup Recovery: automatic scan for enabled and pending downloads
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    android.content.Context context = reactContext.getApplicationContext();
                    java.util.List<AlarmEntity> pendingAlarms = AlarmDatabase.INSTANCE.getInstance(context).alarmDao().getPendingAlarms();
                    for (AlarmEntity alarm : pendingAlarms) {
                        if (alarm.getEnabled() && alarm.getDownloadUrl() != null && !alarm.getDownloadUrl().isEmpty()) {
                            AlarmDownloadManager.INSTANCE.enqueueDownload(context, alarm.getMusicId(), alarm.getDownloadUrl(), alarm.getMd5());
                        }
                    }
                } catch (Exception e) {
                    Log.e("AlarmBridge", "Failed to run startup download recovery", e);
                }
            }
        }).start();
    }

    @Override // com.facebook.react.bridge.NativeModule
    public String getName() {
        return "MantraAlarmBridge";
    }

    @ReactMethod
    public final void createAlarm(final String alarmJson, final Promise promise) {
        Intrinsics.checkNotNullParameter(alarmJson, "alarmJson");
        Intrinsics.checkNotNullParameter(promise, "promise");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.AlarmBridge$$ExternalSyntheticLambda3
            @Override // java.lang.Runnable
            public final void run() {
                AlarmBridge.createAlarm$lambda$0(alarmJson, AlarmBridge.this, promise);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void createAlarm$lambda$0(String str, AlarmBridge alarmBridge, Promise promise) {
        try {
            JSONObject jSONObject = new JSONObject(str);
            String string = jSONObject.getString("id");
            String string2 = jSONObject.getString("label");
            String string3 = jSONObject.getString("musicId");
            String string4 = jSONObject.getString("downloadUrl");
            String optString = jSONObject.optString("md5", "");
            long j = jSONObject.getLong("nextTrigger");
            String string5 = jSONObject.getString("repeatType");
            int i = jSONObject.getInt("weekdaysMask");
            float optDouble = (float) jSONObject.optDouble("volume", 1.0d);
            int optInt = jSONObject.optInt("fadeInDuration", 0);
            boolean optBoolean = jSONObject.optBoolean("vibration", true);
            boolean optBoolean2 = jSONObject.optBoolean("flashlight", false);
            int optInt2 = jSONObject.optInt("autoDismissDuration", 15);
            int optInt3 = jSONObject.optInt("snoozeDuration", 10);
            double optDouble2 = jSONObject.optDouble("latitude", 0.0d);
            double optDouble3 = jSONObject.optDouble("longitude", 0.0d);
            Intrinsics.checkNotNull(string);
            Intrinsics.checkNotNull(string2);
            Intrinsics.checkNotNull(string3);
            Intrinsics.checkNotNull(string5);

            // Cache Lookup & Validation
            java.io.File cachedFile = new java.io.File(alarmBridge.reactContext.getFilesDir(), "chant_" + string3 + ".mp3");
            boolean isCached = cachedFile.exists() && cachedFile.length() > 0;
            String localPath = isCached ? cachedFile.getAbsolutePath() : "";
            String downloadStatus = isCached ? "SUCCESS" : "PENDING";

            AlarmEntity alarm = new AlarmEntity(string, string2, string3, localPath, isCached, 1, j, string5, i, true, optDouble, optInt, optBoolean, optBoolean2, optInt2, optInt3, 0L, 0, 0, optDouble2, optDouble3, System.currentTimeMillis(), System.currentTimeMillis(), "5.0.0", null, null, 0L, null, 251658240, null);
            alarm.setDownloadUrl(string4);
            alarm.setMd5(optString);
            alarm.setDownloadStatus(downloadStatus);

            AlarmDatabase.INSTANCE.getInstance(alarmBridge.reactContext).alarmDao().insertAlarm(alarm);

            // Decoupled Scheduling: Schedule immediately!
            AlarmScheduler.INSTANCE.scheduleAlarm(alarmBridge.reactContext, alarm);

            // Cache Reuse & Background Download Queueing
            if (!isCached) {
                AlarmDownloadManager alarmDownloadManager = AlarmDownloadManager.INSTANCE;
                ReactApplicationContext reactApplicationContext = alarmBridge.reactContext;
                Intrinsics.checkNotNull(string4);
                alarmDownloadManager.enqueueDownload(reactApplicationContext, string3, string4, optString);
            }
            promise.resolve(true);
        } catch (Exception e) {
            Log.e("AlarmBridge", "Failed to create alarm", e);
            promise.reject("CREATE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public final void updateAlarm(final String alarmJson, final Promise promise) {
        Intrinsics.checkNotNullParameter(alarmJson, "alarmJson");
        Intrinsics.checkNotNullParameter(promise, "promise");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.AlarmBridge$$ExternalSyntheticLambda2
            @Override // java.lang.Runnable
            public final void run() {
                AlarmBridge.updateAlarm$lambda$1(alarmJson, AlarmBridge.this, promise);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void updateAlarm$lambda$1(String str, AlarmBridge alarmBridge, Promise promise) {
        try {
            JSONObject jSONObject = new JSONObject(str);
            String string = jSONObject.getString("id");
            String string2 = jSONObject.getString("label");
            long j = jSONObject.getLong("nextTrigger");
            String string3 = jSONObject.getString("repeatType");
            int i = jSONObject.getInt("weekdaysMask");
            float optDouble = (float) jSONObject.optDouble("volume", 1.0d);
            int optInt = jSONObject.optInt("fadeInDuration", 0);
            boolean optBoolean = jSONObject.optBoolean("vibration", true);
            boolean optBoolean2 = jSONObject.optBoolean(ViewProps.ENABLED, true);
            AlarmDatabase companion = AlarmDatabase.INSTANCE.getInstance(alarmBridge.reactContext);
            AlarmDao alarmDao = companion.alarmDao();
            Intrinsics.checkNotNull(string);
            AlarmEntity alarmById = alarmDao.getAlarmById(string);
            if (alarmById == null) {
                promise.reject("NOT_FOUND", "Alarm ID " + string + " not found");
                return;
            }
            Intrinsics.checkNotNull(string2);
            Intrinsics.checkNotNull(string3);
            AlarmEntity copy$default = AlarmEntity.copy$default(alarmById, null, string2, null, null, false, 0, j, string3, i, optBoolean2, optDouble, optInt, optBoolean, false, 0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, System.currentTimeMillis(), null, null, null, 0L, null, 264233021, null);
            companion.alarmDao().updateAlarm(copy$default);
            if (copy$default.getEnabled()) {
                AlarmScheduler.INSTANCE.scheduleAlarm(alarmBridge.reactContext, copy$default);
            } else {
                AlarmScheduler.INSTANCE.cancelAlarm(alarmBridge.reactContext, string);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public final void deleteAlarm(final String id, final Promise promise) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(promise, "promise");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.AlarmBridge$$ExternalSyntheticLambda1
            @Override // java.lang.Runnable
            public final void run() {
                AlarmBridge.deleteAlarm$lambda$2(AlarmBridge.this, id, promise);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void deleteAlarm$lambda$2(AlarmBridge alarmBridge, String str, Promise promise) {
        try {
            AlarmDatabase companion = AlarmDatabase.INSTANCE.getInstance(alarmBridge.reactContext);
            AlarmDao alarmDao = companion.alarmDao();
            AlarmEntity alarm = alarmDao.getAlarmById(str);

            AlarmScheduler.INSTANCE.cancelAlarm(alarmBridge.reactContext, str);

            if (alarm != null) {
                String musicId = alarm.getMusicId();
                String localFilePath = alarm.getLocalFilePath();

                // Delete database record first
                alarmDao.deleteAlarm(str);

                // Reference count check to safely delete cached file and clean up
                if (musicId != null && !musicId.isEmpty()) {
                    java.util.List<AlarmEntity> remaining = alarmDao.getAlarmsByMusicId(musicId);
                    
                    // Cancel download if no other alarms are pending for this musicId
                    java.util.List<AlarmEntity> remainingPending = new java.util.ArrayList<>();
                    for (AlarmEntity a : remaining) {
                        if (!a.isDownloaded()) {
                            remainingPending.add(a);
                        }
                    }
                    if (remainingPending.isEmpty()) {
                        AlarmDownloadManager.INSTANCE.cancelDownload(alarmBridge.reactContext, musicId);
                    }

                    // Delete file only when no other alarms reference it
                    if (remaining.isEmpty() && localFilePath != null && !localFilePath.isEmpty()) {
                        java.io.File file = new java.io.File(localFilePath);
                        if (file.exists()) {
                            boolean deleted = file.delete();
                            Log.i("AlarmBridge", "Deleted orphaned cache file: " + localFilePath + " (result: " + deleted + ")");
                        }
                    }
                }
            } else {
                alarmDao.deleteAlarm(str);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("DELETE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public final void enableAlarm(final String id, final boolean enabled, final Promise promise) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(promise, "promise");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.AlarmBridge$$ExternalSyntheticLambda0
            @Override // java.lang.Runnable
            public final void run() {
                AlarmBridge.enableAlarm$lambda$3(AlarmBridge.this, id, enabled, promise);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void enableAlarm$lambda$3(AlarmBridge alarmBridge, String str, boolean z, Promise promise) {
        try {
            AlarmDatabase companion = AlarmDatabase.INSTANCE.getInstance(alarmBridge.reactContext);
            AlarmDao alarmDao = companion.alarmDao();
            AlarmEntity alarmById = alarmDao.getAlarmById(str);
            if (alarmById != null) {
                AlarmEntity copy$default = AlarmEntity.copy$default(alarmById, null, null, null, null, false, 0, 0L, null, 0, z, 0.0f, 0, false, false, 0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, System.currentTimeMillis(), null, null, null, 0L, null, 264240639, null);
                alarmDao.updateAlarm(copy$default);
                if (z) {
                    AlarmScheduler.INSTANCE.scheduleAlarm(alarmBridge.reactContext, copy$default);
                    // Toggle Recovery: Trigger download check on enabling if missing
                    if (!copy$default.isDownloaded() && copy$default.getDownloadUrl() != null && !copy$default.getDownloadUrl().isEmpty()) {
                        AlarmDownloadManager.INSTANCE.enqueueDownload(alarmBridge.reactContext, copy$default.getMusicId(), copy$default.getDownloadUrl(), copy$default.getMd5());
                    }
                } else {
                    AlarmScheduler.INSTANCE.cancelAlarm(alarmBridge.reactContext, str);
                }
                promise.resolve(true);
                return;
            }
             promise.reject("NOT_FOUND", "Alarm not found");
        } catch (Exception e) {
            promise.reject("ENABLE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public final void getAlarms(final Promise promise) {
        Intrinsics.checkNotNullParameter(promise, "promise");
        new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.AlarmBridge$$ExternalSyntheticLambda4
            @Override // java.lang.Runnable
            public final void run() {
                AlarmBridge.getAlarms$lambda$5(AlarmBridge.this, promise);
            }
        }).start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void getAlarms$lambda$5(AlarmBridge alarmBridge, Promise promise) {
        try {
            List<AlarmEntity> alarms = AlarmDatabase.INSTANCE.getInstance(alarmBridge.reactContext).alarmDao().getAlarms();
            WritableNativeArray writableNativeArray = new WritableNativeArray();
            for (AlarmEntity alarmEntity : alarms) {
                WritableNativeMap writableNativeMap = new WritableNativeMap();
                writableNativeMap.putString("id", alarmEntity.getId());
                writableNativeMap.putString("label", alarmEntity.getLabel());
                writableNativeMap.putString("musicId", alarmEntity.getMusicId());
                writableNativeMap.putString("localFilePath", alarmEntity.getLocalFilePath());
                writableNativeMap.putBoolean("isDownloaded", alarmEntity.isDownloaded());
                writableNativeMap.putDouble("nextTrigger", alarmEntity.getNextTrigger());
                writableNativeMap.putString("repeatType", alarmEntity.getRepeatType());
                writableNativeMap.putInt("weekdaysMask", alarmEntity.getWeekdaysMask());
                writableNativeMap.putBoolean(ViewProps.ENABLED, alarmEntity.getEnabled());
                writableNativeMap.putDouble("volume", alarmEntity.getVolume());
                writableNativeMap.putInt("fadeInDuration", alarmEntity.getFadeInDuration());
                writableNativeMap.putBoolean("vibration", alarmEntity.getVibration());
                writableNativeMap.putBoolean("flashlight", alarmEntity.getFlashlight());
                writableNativeMap.putInt("autoDismissDuration", alarmEntity.getAutoDismissDuration());
                writableNativeMap.putInt("snoozeDuration", alarmEntity.getSnoozeDuration());
                writableNativeArray.pushMap(writableNativeMap);
            }
            promise.resolve(writableNativeArray);
        } catch (Exception e) {
            promise.reject("GET_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public final void isBatteryOptimizationIgnored(Promise promise) {
        Intrinsics.checkNotNullParameter(promise, "promise");
        promise.resolve(Boolean.valueOf(AlarmBatteryManager.INSTANCE.isBatteryOptimizationIgnored(this.reactContext)));
    }

    @ReactMethod
    public final void requestBatteryOptimizationWaiver(Promise promise) {
        Intrinsics.checkNotNullParameter(promise, "promise");
        AlarmBatteryManager.INSTANCE.requestBatteryOptimizationWaiver(this.reactContext);
        promise.resolve(null);
    }

    @ReactMethod
    public final void checkAlarmPermissions(Promise promise) {
        Intrinsics.checkNotNullParameter(promise, "promise");
        boolean hasExact = AlarmPermissions.INSTANCE.canScheduleExactAlarms(this.reactContext);
        boolean hasNotif = AlarmPermissions.INSTANCE.areNotificationsEnabled(this.reactContext);
        promise.resolve(Boolean.valueOf(hasExact && hasNotif));
    }

    @ReactMethod
    public final void requestAlarmPermissions(Promise promise) {
        Intrinsics.checkNotNullParameter(promise, "promise");
        android.content.Context context = this.reactContext;
        android.app.Activity activity = getCurrentActivity();

        boolean needNotif = !AlarmPermissions.INSTANCE.areNotificationsEnabled(context);
        boolean needExact = !AlarmPermissions.INSTANCE.canScheduleExactAlarms(context);

        // 1. Request POST_NOTIFICATIONS runtime permission if SDK >= 33
        if (needNotif) {
            if (Build.VERSION.SDK_INT >= 33 && activity != null) {
                try {
                    activity.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
                } catch (Exception e) {
                    Log.e("AlarmBridge", "Failed to request notification permission via activity", e);
                }
            } else {
                Intent intent = new Intent();
                if (Build.VERSION.SDK_INT >= 26) {
                    intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
                    intent.putExtra("android.provider.extra.APP_PACKAGE", context.getPackageName());
                } else {
                    intent.setAction("android.settings.APPLICATION_DETAILS_SETTINGS");
                    intent.setData(android.net.Uri.fromParts("package", context.getPackageName(), null));
                }
                intent.setFlags(268435456);
                context.startActivity(intent);
            }
        }

        // 2. Request exact alarm permission
        if (needExact) {
            if (Build.VERSION.SDK_INT >= 31) {
                Intent intent = new Intent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM");
                intent.setData(android.net.Uri.fromParts("package", context.getPackageName(), null));
                intent.setFlags(268435456);
                try {
                    context.startActivity(intent);
                } catch (Exception e) {
                    try {
                        intent.setData(null);
                        context.startActivity(intent);
                    } catch (Exception ex) {
                        Log.e("AlarmBridge", "Failed to open exact alarm settings", ex);
                    }
                }
            }
        }

        promise.resolve(true);
    }
}
