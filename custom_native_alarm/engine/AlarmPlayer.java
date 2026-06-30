package com.mantrapuja.official.alarm.engine;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
// Removed duplicate import
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;

import java.io.File;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmPlayer.kt */

/* loaded from: classes3.dex */
public final class AlarmPlayer implements Player.Listener {
    private AudioManager audioManager;
    private final Context context;
    private float currentVolume;
    private ExoPlayer exoPlayer;
    private Runnable fadeRunnable;
    private AudioFocusRequest focusRequest;
    private final Handler handler;
    private float targetVolume;

    /* JADX INFO: Access modifiers changed from: private */
    public static final void abandonAudioFocus$lambda$9(int i) {
    }

    public AlarmPlayer(Context context) {
        Intrinsics.checkNotNullParameter(context, "context");
        this.context = context;
        this.handler = new Handler(Looper.getMainLooper());
        this.targetVolume = 1.0f;
        Object systemService = context.getSystemService(MimeTypes.BASE_TYPE_AUDIO);
        Intrinsics.checkNotNull(systemService, "null cannot be cast to non-null type android.media.AudioManager");
        this.audioManager = (AudioManager) systemService;
    }

    public final void play(final String filePath, float volume, final int fadeInSec) {
        Intrinsics.checkNotNullParameter(filePath, "filePath");
        this.targetVolume = volume;
        if (fadeInSec > 0) {
            volume = 0.0f;
        }
        this.currentVolume = volume;
        if (!requestAudioFocus()) {
            Log.e("AlarmPlayer", "Audio Focus request denied");
        }
        this.handler.post(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda5
            @Override // java.lang.Runnable
            public final void run() {
                AlarmPlayer.play$lambda$1(AlarmPlayer.this, fadeInSec, filePath);
            }
        });
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void play$lambda$1(AlarmPlayer alarmPlayer, int i, String str) {
        try {
            ExoPlayer build = new ExoPlayer.Builder(alarmPlayer.context).build();
            androidx.media3.common.AudioAttributes build2 = new androidx.media3.common.AudioAttributes.Builder().setUsage(4).setContentType(2).build();
            Intrinsics.checkNotNullExpressionValue(build2, "build(...)");
            build.setAudioAttributes(build2, true);
            build.setVolume(alarmPlayer.currentVolume);
            build.setRepeatMode(2);
            build.addListener(alarmPlayer);
            build.setMediaItem(alarmPlayer.createMediaItem(str));
            build.prepare();
            build.play();
            alarmPlayer.exoPlayer = build;
            if (i > 0) {
                alarmPlayer.startFadeIn(i);
            }
        } catch (Exception e) {
            Log.e("AlarmPlayer", "Failed to start ExoPlayer", e);
            alarmPlayer.playFallback();
        }
    }

    private final MediaItem createMediaItem(String filePath) {
        File file = new File(filePath);
        if (file.exists()) {
            MediaItem fromUri = MediaItem.fromUri(Uri.fromFile(file));
            Intrinsics.checkNotNull(fromUri);
            return fromUri;
        }
        Log.w("AlarmPlayer", "Alarm file does not exist at path: " + filePath + ". Using fallback.");
        MediaItem fromUri2 = MediaItem.fromUri(Uri.parse("android.resource://" + this.context.getPackageName() + "/raw/bell_sound"));
        Intrinsics.checkNotNull(fromUri2);
        return fromUri2;
    }

    private final void playFallback() {
        Log.i("AlarmPlayer", "Playing fallback alarm sound...");
        this.handler.post(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda2
            @Override // java.lang.Runnable
            public final void run() {
                AlarmPlayer.playFallback$lambda$4(AlarmPlayer.this);
            }
        });
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void playFallback$lambda$4(AlarmPlayer alarmPlayer) {
        try {
            ExoPlayer exoPlayer = alarmPlayer.exoPlayer;
            if (exoPlayer != null) {
                exoPlayer.release();
            }
            ExoPlayer build = new ExoPlayer.Builder(alarmPlayer.context).build();
            androidx.media3.common.AudioAttributes build2 = new androidx.media3.common.AudioAttributes.Builder().setUsage(4).setContentType(4).build();
            Intrinsics.checkNotNullExpressionValue(build2, "build(...)");
            build.setAudioAttributes(build2, true);
            build.setVolume(alarmPlayer.targetVolume);
            build.setRepeatMode(2);
            build.setMediaItem(MediaItem.fromUri(RingtoneManager.getDefaultUri(4)));
            build.prepare();
            build.play();
            alarmPlayer.exoPlayer = build;
        } catch (Exception e) {
            Log.e("AlarmPlayer", "Fallback alarm play failed", e);
        }
    }

    @Override // androidx.media3.common.Player.Listener
    public void onPlayerError(PlaybackException error) {
        Intrinsics.checkNotNullParameter(error, "error");
        Log.e("AlarmPlayer", "ExoPlayer error occurred: " + error.getMessage(), error);
        playFallback();
    }

    private final void startFadeIn(int durationSec) {
        final long j = (durationSec * 1000) / 20;
        final float f = this.targetVolume / 20;
        Runnable runnable = new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$startFadeIn$1
            @Override // java.lang.Runnable
            public void run() {
                ExoPlayer exoPlayer;
                float f2;
                float f3;
                float f4;
                ExoPlayer exoPlayer2;
                Handler handler;
                float f5;
                float f6;
                ExoPlayer exoPlayer3;
                float f7;
                exoPlayer = AlarmPlayer.this.exoPlayer;
                if (exoPlayer == null) {
                    return;
                }
                AlarmPlayer alarmPlayer = AlarmPlayer.this;
                f2 = alarmPlayer.currentVolume;
                alarmPlayer.currentVolume = f2 + f;
                f3 = AlarmPlayer.this.currentVolume;
                f4 = AlarmPlayer.this.targetVolume;
                if (f3 < f4) {
                    exoPlayer2 = AlarmPlayer.this.exoPlayer;
                    if (exoPlayer2 != null) {
                        f5 = AlarmPlayer.this.currentVolume;
                        exoPlayer2.setVolume(f5);
                    }
                    handler = AlarmPlayer.this.handler;
                    handler.postDelayed(this, j);
                    return;
                }
                AlarmPlayer alarmPlayer2 = AlarmPlayer.this;
                f6 = alarmPlayer2.targetVolume;
                alarmPlayer2.currentVolume = f6;
                exoPlayer3 = AlarmPlayer.this.exoPlayer;
                if (exoPlayer3 != null) {
                    f7 = AlarmPlayer.this.currentVolume;
                    exoPlayer3.setVolume(f7);
                }
                Log.i("AlarmPlayer", "Fade-in complete. Target volume reached.");
            }
        };
        this.fadeRunnable = runnable;
        Handler handler = this.handler;
        Intrinsics.checkNotNull(runnable);
        handler.post(runnable);
    }

    public final void stop() {
        this.handler.removeCallbacksAndMessages(null);
        this.fadeRunnable = null;
        this.handler.post(new Runnable() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda1
            @Override // java.lang.Runnable
            public final void run() {
                AlarmPlayer.stop$lambda$5(AlarmPlayer.this);
            }
        });
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void stop$lambda$5(AlarmPlayer alarmPlayer) {
        try {
            ExoPlayer exoPlayer = alarmPlayer.exoPlayer;
            if (exoPlayer != null) {
                exoPlayer.stop();
            }
            ExoPlayer exoPlayer2 = alarmPlayer.exoPlayer;
            if (exoPlayer2 != null) {
                exoPlayer2.release();
            }
            alarmPlayer.exoPlayer = null;
            alarmPlayer.abandonAudioFocus();
            Log.i("AlarmPlayer", "ExoPlayer stopped and released");
        } catch (Exception e) {
            Log.e("AlarmPlayer", "Error during release", e);
        }
    }

    private final boolean requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            AudioFocusRequest build = new AudioFocusRequest.Builder(4).setAudioAttributes(new AudioAttributes.Builder().setUsage(4).setContentType(2).build()).setAcceptsDelayedFocusGain(false).setOnAudioFocusChangeListener(new AudioManager.OnAudioFocusChangeListener() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda3
                @Override // android.media.AudioManager.OnAudioFocusChangeListener
                public final void onAudioFocusChange(int i) {
                    AlarmPlayer.requestAudioFocus$lambda$6(AlarmPlayer.this, i);
                }
            }).build();
            this.focusRequest = build;
            AudioManager audioManager = this.audioManager;
            if (audioManager != null) {
                Intrinsics.checkNotNull(build);
                if (audioManager.requestAudioFocus(build) == 1) {
                    return true;
                }
            }
            return false;
        }
        AudioManager audioManager2 = this.audioManager;
        return audioManager2 != null && audioManager2.requestAudioFocus(new AudioManager.OnAudioFocusChangeListener() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda4
            @Override // android.media.AudioManager.OnAudioFocusChangeListener
            public final void onAudioFocusChange(int i) {
                AlarmPlayer.requestAudioFocus$lambda$7(AlarmPlayer.this, i);
            }
        }, 4, 4) == 1;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void requestAudioFocus$lambda$6(AlarmPlayer alarmPlayer, int i) {
        if (i == -1) {
            alarmPlayer.stop();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void requestAudioFocus$lambda$7(AlarmPlayer alarmPlayer, int i) {
        if (i == -1) {
            alarmPlayer.stop();
        }
    }

    private final void abandonAudioFocus() {
        AudioManager audioManager;
        if (Build.VERSION.SDK_INT >= 26) {
            AudioFocusRequest audioFocusRequest = this.focusRequest;
            if (audioFocusRequest == null || (audioManager = this.audioManager) == null) {
                return;
            }
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            return;
        }
        AudioManager audioManager2 = this.audioManager;
        if (audioManager2 != null) {
            audioManager2.abandonAudioFocus(new AudioManager.OnAudioFocusChangeListener() { // from class: com.mantrapuja.official.alarm.engine.AlarmPlayer$$ExternalSyntheticLambda0
                @Override // android.media.AudioManager.OnAudioFocusChangeListener
                public final void onAudioFocusChange(int i) {
                    AlarmPlayer.abandonAudioFocus$lambda$9(i);
                }
            });
        }
    }
}
