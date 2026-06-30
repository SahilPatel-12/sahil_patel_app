package com.mantrapuja.official.alarm.db;

import java.util.List;
import kotlin.Metadata;

/* compiled from: AlarmHistoryDao.kt */

/* loaded from: classes3.dex */
public interface AlarmHistoryDao {
    void deleteHistoryBefore(long timestamp);

    List<AlarmHistoryEntity> getHistory();

    void insertHistory(AlarmHistoryEntity history);
}
