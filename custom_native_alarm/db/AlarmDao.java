package com.mantrapuja.official.alarm.db;

import androidx.core.app.NotificationCompat;
import java.util.List;
import kotlin.Metadata;

/* compiled from: AlarmDao.kt */

/* loaded from: classes3.dex */
public interface AlarmDao {
    void deleteAlarm(String id);

    AlarmEntity getAlarmById(String id);

    List<AlarmEntity> getAlarms();

    List<AlarmEntity> getEnabledAlarms();

    void insertAlarm(AlarmEntity alarm);

    void updateAlarm(AlarmEntity alarm);
}
