package com.mantrapuja.official.alarm.db;

import java.util.List;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import kotlin.Metadata;

/* compiled from: AlarmHistoryDao.kt */

/* loaded from: classes3.dex */
@Dao
public interface AlarmHistoryDao {
    @Query("DELETE FROM AlarmHistoryEntity WHERE scheduledTime < :timestamp")
    void deleteHistoryBefore(long timestamp);

    @Query("SELECT * FROM AlarmHistoryEntity ORDER BY scheduledTime DESC")
    List<AlarmHistoryEntity> getHistory();

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertHistory(AlarmHistoryEntity history);
}
