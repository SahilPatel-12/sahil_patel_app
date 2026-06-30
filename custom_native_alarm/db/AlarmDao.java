package com.mantrapuja.official.alarm.db;

import androidx.core.app.NotificationCompat;
import java.util.List;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;
import kotlin.Metadata;

/* compiled from: AlarmDao.kt */

/* loaded from: classes3.dex */
@Dao
public interface AlarmDao {
    @Query("DELETE FROM AlarmEntity WHERE id = :id")
    void deleteAlarm(String id);

    @Query("SELECT * FROM AlarmEntity WHERE id = :id")
    AlarmEntity getAlarmById(String id);

    @Query("SELECT * FROM AlarmEntity")
    List<AlarmEntity> getAlarms();

    @Query("SELECT * FROM AlarmEntity WHERE enabled = 1")
    List<AlarmEntity> getEnabledAlarms();

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAlarm(AlarmEntity alarm);

    @Update
    void updateAlarm(AlarmEntity alarm);
}
