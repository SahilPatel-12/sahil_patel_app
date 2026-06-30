package com.mantrapuja.official.alarm.db;

import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

/* compiled from: AlarmHistoryEntity.kt */

/* loaded from: classes3.dex */
@Entity
public final /* data */ class AlarmHistoryEntity {
    private final String alarmId;
    private final String appVersion;
    private final boolean completed;
    private final long dismissTime;
    private final long durationPlayed;
    private final String failureReason;
    @PrimaryKey
    @NonNull
    private final String id;
    private final boolean missed;
    private final long scheduledTime;
    private final int snoozeCount;
    private final long triggerTime;

    /* renamed from: component1, reason: from getter */
    public final String getId() {
        return this.id;
    }

    /* renamed from: component10, reason: from getter */
    public final String getFailureReason() {
        return this.failureReason;
    }

    /* renamed from: component11, reason: from getter */
    public final String getAppVersion() {
        return this.appVersion;
    }

    /* renamed from: component2, reason: from getter */
    public final String getAlarmId() {
        return this.alarmId;
    }

    /* renamed from: component3, reason: from getter */
    public final long getScheduledTime() {
        return this.scheduledTime;
    }

    /* renamed from: component4, reason: from getter */
    public final long getTriggerTime() {
        return this.triggerTime;
    }

    /* renamed from: component5, reason: from getter */
    public final long getDismissTime() {
        return this.dismissTime;
    }

    /* renamed from: component6, reason: from getter */
    public final int getSnoozeCount() {
        return this.snoozeCount;
    }

    /* renamed from: component7, reason: from getter */
    public final long getDurationPlayed() {
        return this.durationPlayed;
    }

    /* renamed from: component8, reason: from getter */
    public final boolean getCompleted() {
        return this.completed;
    }

    /* renamed from: component9, reason: from getter */
    public final boolean getMissed() {
        return this.missed;
    }

    public final AlarmHistoryEntity copy(String id, String alarmId, long scheduledTime, long triggerTime, long dismissTime, int snoozeCount, long durationPlayed, boolean completed, boolean missed, String failureReason, String appVersion) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(alarmId, "alarmId");
        Intrinsics.checkNotNullParameter(appVersion, "appVersion");
        return new AlarmHistoryEntity(id, alarmId, scheduledTime, triggerTime, dismissTime, snoozeCount, durationPlayed, completed, missed, failureReason, appVersion);
    }

    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AlarmHistoryEntity)) {
            return false;
        }
        AlarmHistoryEntity alarmHistoryEntity = (AlarmHistoryEntity) other;
        return Intrinsics.areEqual(this.id, alarmHistoryEntity.id) && Intrinsics.areEqual(this.alarmId, alarmHistoryEntity.alarmId) && this.scheduledTime == alarmHistoryEntity.scheduledTime && this.triggerTime == alarmHistoryEntity.triggerTime && this.dismissTime == alarmHistoryEntity.dismissTime && this.snoozeCount == alarmHistoryEntity.snoozeCount && this.durationPlayed == alarmHistoryEntity.durationPlayed && this.completed == alarmHistoryEntity.completed && this.missed == alarmHistoryEntity.missed && Intrinsics.areEqual(this.failureReason, alarmHistoryEntity.failureReason) && Intrinsics.areEqual(this.appVersion, alarmHistoryEntity.appVersion);
    }

    public int hashCode() {
        int hashCode = ((((((((((((((((this.id.hashCode() * 31) + this.alarmId.hashCode()) * 31) + Long.hashCode(this.scheduledTime)) * 31) + Long.hashCode(this.triggerTime)) * 31) + Long.hashCode(this.dismissTime)) * 31) + Integer.hashCode(this.snoozeCount)) * 31) + Long.hashCode(this.durationPlayed)) * 31) + Boolean.hashCode(this.completed)) * 31) + Boolean.hashCode(this.missed)) * 31;
        String str = this.failureReason;
        return ((hashCode + (str == null ? 0 : str.hashCode())) * 31) + this.appVersion.hashCode();
    }

    public String toString() {
        return "AlarmHistoryEntity(id=" + this.id + ", alarmId=" + this.alarmId + ", scheduledTime=" + this.scheduledTime + ", triggerTime=" + this.triggerTime + ", dismissTime=" + this.dismissTime + ", snoozeCount=" + this.snoozeCount + ", durationPlayed=" + this.durationPlayed + ", completed=" + this.completed + ", missed=" + this.missed + ", failureReason=" + this.failureReason + ", appVersion=" + this.appVersion + ")";
    }

    public AlarmHistoryEntity(String id, String alarmId, long scheduledTime, long triggerTime, long dismissTime, int snoozeCount, long durationPlayed, boolean completed, boolean missed, String failureReason, String appVersion) {
        Intrinsics.checkNotNullParameter(id, "id");
        Intrinsics.checkNotNullParameter(alarmId, "alarmId");
        Intrinsics.checkNotNullParameter(appVersion, "appVersion");
        this.id = id;
        this.alarmId = alarmId;
        this.scheduledTime = scheduledTime;
        this.triggerTime = triggerTime;
        this.dismissTime = dismissTime;
        this.snoozeCount = snoozeCount;
        this.durationPlayed = durationPlayed;
        this.completed = completed;
        this.missed = missed;
        this.failureReason = failureReason;
        this.appVersion = appVersion;
    }

}