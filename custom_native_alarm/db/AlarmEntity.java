package com.mantrapuja.official.alarm.db;

import androidx.media3.common.C;
import com.facebook.react.uimanager.ViewProps;

import kotlin.Metadata;
import kotlin.jvm.internal.DefaultConstructorMarker;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmEntity.kt */

/* loaded from: classes3.dex */
public final /* data */ class AlarmEntity {
    private final int autoDismissDuration;
    private final String cloudId;
    private final long createdAt;
    private final String createdByAppVersion;
    private final String deviceId;
    private final int downloadVersion;
    private final boolean enabled;
    private final int fadeInDuration;
    private final boolean flashlight;
    private final String id;
    private final boolean isDownloaded;
    private final String label;
    private final long lastSync;
    private final long lastTriggered;
    private final double latitude;
    private final String localFilePath;
    private final double longitude;
    private final int missedAlarmCount;
    private final String musicId;
    private final long nextTrigger;
    private final String repeatType;
    private final int snoozeDuration;
    private final String syncStatus;
    private final int triggerCount;
    private final long updatedAt;
    private final boolean vibration;
    private final float volume;
    private final int weekdaysMask;

    public static /* synthetic */ AlarmEntity copy$default(AlarmEntity alarmEntity, String str, String str2, String str3, String str4, boolean z, int i, long j, String str5, int i2, boolean z2, float f, int i3, boolean z3, boolean z4, int i4, int i5, long j2, int i6, int i7, double d, double d2, long j3, long j4, String str6, String str7, String str8, long j5, String str9, int i8, Object obj) {
        String str10;
        long j6;
        int i9;
        int i10;
        double d3;
        double d4;
        long j7;
        long j8;
        String str11;
        String str12;
        String str13;
        int i11;
        long j9;
        String str14;
        int i12;
        boolean z5;
        float f2;
        int i13;
        boolean z6;
        boolean z7;
        int i14;
        int i15;
        long j10;
        String str15;
        String str16;
        String str17;
        boolean z8;
        String str18 = (i8 & 1) != 0 ? alarmEntity.id : str;
        String str19 = (i8 & 2) != 0 ? alarmEntity.label : str2;
        String str20 = (i8 & 4) != 0 ? alarmEntity.musicId : str3;
        String str21 = (i8 & 8) != 0 ? alarmEntity.localFilePath : str4;
        boolean z9 = (i8 & 16) != 0 ? alarmEntity.isDownloaded : z;
        int i16 = (i8 & 32) != 0 ? alarmEntity.downloadVersion : i;
        long j11 = (i8 & 64) != 0 ? alarmEntity.nextTrigger : j;
        String str22 = (i8 & 128) != 0 ? alarmEntity.repeatType : str5;
        int i17 = (i8 & 256) != 0 ? alarmEntity.weekdaysMask : i2;
        boolean z10 = (i8 & 512) != 0 ? alarmEntity.enabled : z2;
        float f3 = (i8 & 1024) != 0 ? alarmEntity.volume : f;
        int i18 = (i8 & 2048) != 0 ? alarmEntity.fadeInDuration : i3;
        boolean z11 = (i8 & 4096) != 0 ? alarmEntity.vibration : z3;
        String str23 = str18;
        boolean z12 = (i8 & 8192) != 0 ? alarmEntity.flashlight : z4;
        int i19 = (i8 & 16384) != 0 ? alarmEntity.autoDismissDuration : i4;
        int i20 = (i8 & 32768) != 0 ? alarmEntity.snoozeDuration : i5;
        int i21 = i19;
        long j12 = (i8 & 65536) != 0 ? alarmEntity.lastTriggered : j2;
        int i22 = (i8 & 131072) != 0 ? alarmEntity.triggerCount : i6;
        int i23 = (i8 & 262144) != 0 ? alarmEntity.missedAlarmCount : i7;
        double d5 = (i8 & 524288) != 0 ? alarmEntity.latitude : d;
        double d6 = (i8 & 1048576) != 0 ? alarmEntity.longitude : d2;
        long j13 = (i8 & 2097152) != 0 ? alarmEntity.createdAt : j3;
        long j14 = (i8 & 4194304) != 0 ? alarmEntity.updatedAt : j4;
        String str24 = (i8 & 8388608) != 0 ? alarmEntity.createdByAppVersion : str6;
        String str25 = (i8 & 16777216) != 0 ? alarmEntity.cloudId : str7;
        String str26 = str24;
        String str27 = (i8 & 33554432) != 0 ? alarmEntity.syncStatus : str8;
        String str28 = str25;
        long j15 = (i8 & 67108864) != 0 ? alarmEntity.lastSync : j5;
        if ((i8 & C.BUFFER_FLAG_FIRST_SAMPLE) != 0) {
            j6 = j15;
            str10 = alarmEntity.deviceId;
            i10 = i23;
            d3 = d5;
            d4 = d6;
            j7 = j13;
            j8 = j14;
            str11 = str26;
            str12 = str28;
            str13 = str27;
            j9 = j11;
            str14 = str22;
            i12 = i17;
            z5 = z10;
            f2 = f3;
            i13 = i18;
            z6 = z11;
            z7 = z12;
            i14 = i21;
            i15 = i20;
            j10 = j12;
            i9 = i22;
            str15 = str19;
            str16 = str20;
            str17 = str21;
            z8 = z9;
            i11 = i16;
        } else {
            str10 = str9;
            j6 = j15;
            i9 = i22;
            i10 = i23;
            d3 = d5;
            d4 = d6;
            j7 = j13;
            j8 = j14;
            str11 = str26;
            str12 = str28;
            str13 = str27;
            i11 = i16;
            j9 = j11;
            str14 = str22;
            i12 = i17;
            z5 = z10;
            f2 = f3;
            i13 = i18;
            z6 = z11;
            z7 = z12;
            i14 = i21;
            i15 = i20;
            j10 = j12;
            str15 = str19;
            str16 = str20;
            str17 = str21;
            z8 = z9;
        }
        return alarmEntity.copy(str23, str15, str16, str17, z8, i11, j9, str14, i12, z5, f2, i13, z6, z7, i14, i15, j10, i9, i10, d3, d4, j7, j8, str11, str12, str13, j6, str10);
    }

    /* renamed from: component1, reason: from getter */
    public final String getId() {
        return this.id;
    }

    /* renamed from: component10, reason: from getter */
    public final boolean getEnabled() {
        return this.enabled;
    }

    /* renamed from: component11, reason: from getter */
    public final float getVolume() {
        return this.volume;
    }

    /* renamed from: component12, reason: from getter */
    public final int getFadeInDuration() {
        return this.fadeInDuration;
    }

    /* renamed from: component13, reason: from getter */
    public final boolean getVibration() {
        return this.vibration;
    }

    /* renamed from: component14, reason: from getter */
    public final boolean getFlashlight() {
        return this.flashlight;
    }

    /* renamed from: component15, reason: from getter */
    public final int getAutoDismissDuration() {
        return this.autoDismissDuration;
    }

    /* renamed from: component16, reason: from getter */
    public final int getSnoozeDuration() {
        return this.snoozeDuration;
    }

    /* renamed from: component17, reason: from getter */
    public final long getLastTriggered() {
        return this.lastTriggered;
    }

    /* renamed from: component18, reason: from getter */
    public final int getTriggerCount() {
        return this.triggerCount;
    }

    /* renamed from: component19, reason: from getter */
    public final int getMissedAlarmCount() {
        return this.missedAlarmCount;
    }

    /* renamed from: component2, reason: from getter */
    public final String getLabel() {
        return this.label;
    }

    /* renamed from: component20, reason: from getter */
    public final double getLatitude() {
        return this.latitude;
    }

    /* renamed from: component21, reason: from getter */
    public final double getLongitude() {
        return this.longitude;
    }

    /* renamed from: component22, reason: from getter */
    public final long getCreatedAt() {
        return this.createdAt;
    }

    /* renamed from: component23, reason: from getter */
    public final long getUpdatedAt() {
        return this.updatedAt;
    }

    /* renamed from: component24, reason: from getter */
    public final String getCreatedByAppVersion() {
        return this.createdByAppVersion;
    }

    /* renamed from: component25, reason: from getter */
    public final String getCloudId() {
        return this.cloudId;
    }

    /* renamed from: component26, reason: from getter */
    public final String getSyncStatus() {
        return this.syncStatus;
    }

    /* renamed from: component27, reason: from getter */
    public final long getLastSync() {
        return this.lastSync;
    }

    /* renamed from: component28, reason: from getter */
    public final String getDeviceId() {
        return this.deviceId;
    }

    /* renamed from: component3, reason: from getter */
    public final String getMusicId() {
        return this.musicId;
    }

    /* renamed from: component4, reason: from getter */
    public final String getLocalFilePath() {
        return this.localFilePath;
    }

    /* renamed from: component5, reason: from getter */
    public final boolean isDownloaded() {
        return this.isDownloaded;
    }

    /* renamed from: component6, reason: from getter */
    public final int getDownloadVersion() {
        return this.downloadVersion;
    }

    /* renamed from: component7, reason: from getter */
    public final long getNextTrigger() {
        return this.nextTrigger;
    }

    /* renamed from: component8, reason: from getter */
    public final String getRepeatType() {
        return this.repeatType;
    }

    /* renamed from: component9, reason: from getter */
    public final int getWeekdaysMask() {
        return this.weekdaysMask;
    }

    public final AlarmEntity copy(String id, String label, String musicId, String localFilePath, boolean isDownloaded, int downloadVersion, long nextTrigger, String repeatType, int weekdaysMask, boolean enabled, float volume, int fadeInDuration, boolean vibration, boolean flashlight, int autoDismissDuration, int snoozeDuration, long lastTriggered, int triggerCount, int missedAlarmCount, double latitude, double longitude, long createdAt, long updatedAt, String createdByAppVersion, String cloudId, String syncStatus, long lastSync, String deviceId) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(label, "label");
        Intrinsics.checkNotNullParameter(musicId, "musicId");
        Intrinsics.checkNotNullParameter(localFilePath, "localFilePath");
        Intrinsics.checkNotNullParameter(repeatType, "repeatType");
        Intrinsics.checkNotNullParameter(createdByAppVersion, "createdByAppVersion");
        Intrinsics.checkNotNullParameter(syncStatus, "syncStatus");
        return new AlarmEntity(id, label, musicId, localFilePath, isDownloaded, downloadVersion, nextTrigger, repeatType, weekdaysMask, enabled, volume, fadeInDuration, vibration, flashlight, autoDismissDuration, snoozeDuration, lastTriggered, triggerCount, missedAlarmCount, latitude, longitude, createdAt, updatedAt, createdByAppVersion, cloudId, syncStatus, lastSync, deviceId);
    }

    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AlarmEntity)) {
            return false;
        }
        AlarmEntity alarmEntity = (AlarmEntity) other;
        return Intrinsics.areEqual(this.id, alarmEntity.id) && Intrinsics.areEqual(this.label, alarmEntity.label) && Intrinsics.areEqual(this.musicId, alarmEntity.musicId) && Intrinsics.areEqual(this.localFilePath, alarmEntity.localFilePath) && this.isDownloaded == alarmEntity.isDownloaded && this.downloadVersion == alarmEntity.downloadVersion && this.nextTrigger == alarmEntity.nextTrigger && Intrinsics.areEqual(this.repeatType, alarmEntity.repeatType) && this.weekdaysMask == alarmEntity.weekdaysMask && this.enabled == alarmEntity.enabled && Float.compare(this.volume, alarmEntity.volume) == 0 && this.fadeInDuration == alarmEntity.fadeInDuration && this.vibration == alarmEntity.vibration && this.flashlight == alarmEntity.flashlight && this.autoDismissDuration == alarmEntity.autoDismissDuration && this.snoozeDuration == alarmEntity.snoozeDuration && this.lastTriggered == alarmEntity.lastTriggered && this.triggerCount == alarmEntity.triggerCount && this.missedAlarmCount == alarmEntity.missedAlarmCount && Double.compare(this.latitude, alarmEntity.latitude) == 0 && Double.compare(this.longitude, alarmEntity.longitude) == 0 && this.createdAt == alarmEntity.createdAt && this.updatedAt == alarmEntity.updatedAt && Intrinsics.areEqual(this.createdByAppVersion, alarmEntity.createdByAppVersion) && Intrinsics.areEqual(this.cloudId, alarmEntity.cloudId) && Intrinsics.areEqual(this.syncStatus, alarmEntity.syncStatus) && this.lastSync == alarmEntity.lastSync && Intrinsics.areEqual(this.deviceId, alarmEntity.deviceId);
    }

    public int hashCode() {
        int hashCode = ((((((((((((((((((((((((((((((((((((((((((((((this.id.hashCode() * 31) + this.label.hashCode()) * 31) + this.musicId.hashCode()) * 31) + this.localFilePath.hashCode()) * 31) + Boolean.hashCode(this.isDownloaded)) * 31) + Integer.hashCode(this.downloadVersion)) * 31) + Long.hashCode(this.nextTrigger)) * 31) + this.repeatType.hashCode()) * 31) + Integer.hashCode(this.weekdaysMask)) * 31) + Boolean.hashCode(this.enabled)) * 31) + Float.hashCode(this.volume)) * 31) + Integer.hashCode(this.fadeInDuration)) * 31) + Boolean.hashCode(this.vibration)) * 31) + Boolean.hashCode(this.flashlight)) * 31) + Integer.hashCode(this.autoDismissDuration)) * 31) + Integer.hashCode(this.snoozeDuration)) * 31) + Long.hashCode(this.lastTriggered)) * 31) + Integer.hashCode(this.triggerCount)) * 31) + Integer.hashCode(this.missedAlarmCount)) * 31) + Double.hashCode(this.latitude)) * 31) + Double.hashCode(this.longitude)) * 31) + Long.hashCode(this.createdAt)) * 31) + Long.hashCode(this.updatedAt)) * 31) + this.createdByAppVersion.hashCode()) * 31;
        String str = this.cloudId;
        int hashCode2 = (((((hashCode + (str == null ? 0 : str.hashCode())) * 31) + this.syncStatus.hashCode()) * 31) + Long.hashCode(this.lastSync)) * 31;
        String str2 = this.deviceId;
        return hashCode2 + (str2 != null ? str2.hashCode() : 0);
    }

    public String toString() {
        return "AlarmEntity(id=" + this.id + ", label=" + this.label + ", musicId=" + this.musicId + ", localFilePath=" + this.localFilePath + ", isDownloaded=" + this.isDownloaded + ", downloadVersion=" + this.downloadVersion + ", nextTrigger=" + this.nextTrigger + ", repeatType=" + this.repeatType + ", weekdaysMask=" + this.weekdaysMask + ", enabled=" + this.enabled + ", volume=" + this.volume + ", fadeInDuration=" + this.fadeInDuration + ", vibration=" + this.vibration + ", flashlight=" + this.flashlight + ", autoDismissDuration=" + this.autoDismissDuration + ", snoozeDuration=" + this.snoozeDuration + ", lastTriggered=" + this.lastTriggered + ", triggerCount=" + this.triggerCount + ", missedAlarmCount=" + this.missedAlarmCount + ", latitude=" + this.latitude + ", longitude=" + this.longitude + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ", createdByAppVersion=" + this.createdByAppVersion + ", cloudId=" + this.cloudId + ", syncStatus=" + this.syncStatus + ", lastSync=" + this.lastSync + ", deviceId=" + this.deviceId + ")";
    }

    public AlarmEntity(String id, String label, String musicId, String localFilePath, boolean z, int i, long j, String repeatType, int i2, boolean z2, float f, int i3, boolean z3, boolean z4, int i4, int i5, long j2, int i6, int i7, double d, double d2, long j3, long j4, String createdByAppVersion, String str, String syncStatus, long j5, String str2) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(label, "label");
        Intrinsics.checkNotNullParameter(musicId, "musicId");
        Intrinsics.checkNotNullParameter(localFilePath, "localFilePath");
        Intrinsics.checkNotNullParameter(repeatType, "repeatType");
        Intrinsics.checkNotNullParameter(createdByAppVersion, "createdByAppVersion");
        Intrinsics.checkNotNullParameter(syncStatus, "syncStatus");
        this.id = id;
        this.label = label;
        this.musicId = musicId;
        this.localFilePath = localFilePath;
        this.isDownloaded = z;
        this.downloadVersion = i;
        this.nextTrigger = j;
        this.repeatType = repeatType;
        this.weekdaysMask = i2;
        this.enabled = z2;
        this.volume = f;
        this.fadeInDuration = i3;
        this.vibration = z3;
        this.flashlight = z4;
        this.autoDismissDuration = i4;
        this.snoozeDuration = i5;
        this.lastTriggered = j2;
        this.triggerCount = i6;
        this.missedAlarmCount = i7;
        this.latitude = d;
        this.longitude = d2;
        this.createdAt = j3;
        this.updatedAt = j4;
        this.createdByAppVersion = createdByAppVersion;
        this.cloudId = str;
        this.syncStatus = syncStatus;
        this.lastSync = j5;
        this.deviceId = str2;
    }

    public /* synthetic */ AlarmEntity(String str, String str2, String str3, String str4, boolean z, int i, long j, String str5, int i2, boolean z2, float f, int i3, boolean z3, boolean z4, int i4, int i5, long j2, int i6, int i7, double d, double d2, long j3, long j4, String str6, String str7, String str8, long j5, String str9, int i8, DefaultConstructorMarker defaultConstructorMarker) {
        this(str, str2, str3, str4, z, i, j, str5, i2, z2, f, i3, z3, z4, i4, i5, j2, i6, i7, d, d2, j3, j4, str6, (i8 & 16777216) != 0 ? null : str7, (i8 & 33554432) != 0 ? "SYNCED" : str8, (i8 & 67108864) != 0 ? 0L : j5, (i8 & C.BUFFER_FLAG_FIRST_SAMPLE) != 0 ? null : str9);
    }

    
}
