package com.mantrapuja.official.alarm.manager;

import android.content.Context;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;
import kotlin.Metadata;
import kotlin.Pair;
import kotlin.TuplesKt;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmDownloadManager.kt */

/* loaded from: classes3.dex */
public final class AlarmDownloadManager {
    public static final AlarmDownloadManager INSTANCE = new AlarmDownloadManager();

    private AlarmDownloadManager() {
    }

    public final void enqueueDownload(Context context, String musicId, String url, String md5) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(musicId, "musicId");
        Intrinsics.checkNotNullParameter(url, "url");
        Constraints build = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        Pair[] pairArr = {TuplesKt.to("musicId", musicId), TuplesKt.to("url", url), TuplesKt.to("md5", md5)};
        Data.Builder builder = new Data.Builder();
        for (int i = 0; i < 3; i++) {
            Pair pair = pairArr[i];
            builder.put((String) pair.getFirst(), pair.getSecond());
        }
        Data build2 = builder.build();
        Intrinsics.checkNotNullExpressionValue(build2, "dataBuilder.build()");
        WorkManager.getInstance(context.getApplicationContext()).enqueueUniqueWork("download_chant_" + musicId, ExistingWorkPolicy.KEEP, new OneTimeWorkRequest.Builder(AlarmDownloadWorker.class).setConstraints(build).setInputData(build2).setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10L, TimeUnit.SECONDS).build());
    }

    public final void cancelDownload(Context context, String musicId) {
        Intrinsics.checkNotNullParameter(context, "context");
        Intrinsics.checkNotNullParameter(musicId, "musicId");
        WorkManager.getInstance(context.getApplicationContext()).cancelUniqueWork("download_chant_" + musicId);
    }
}
