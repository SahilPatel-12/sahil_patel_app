package com.mantrapuja.official.alarm.db;

import android.content.Context;
import androidx.room.Room;
import androidx.room.Database;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;
import kotlin.Metadata;
import kotlin.jvm.internal.DefaultConstructorMarker;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: AlarmDatabase.kt */

/* loaded from: classes3.dex */
@Database(entities = {AlarmEntity.class, AlarmHistoryEntity.class}, version = 2, exportSchema = false)
public abstract class AlarmDatabase extends RoomDatabase {

    /* renamed from: Companion, reason: from kotlin metadata */
    public static final Companion INSTANCE = new Companion(null);
    private static volatile AlarmDatabase INSTANCE;

    public abstract AlarmDao alarmDao();

    public abstract AlarmHistoryDao alarmHistoryDao();

    public static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(SupportSQLiteDatabase database) {
            database.execSQL("ALTER TABLE AlarmEntity ADD COLUMN downloadUrl TEXT NOT NULL DEFAULT ''");
            database.execSQL("ALTER TABLE AlarmEntity ADD COLUMN md5 TEXT NOT NULL DEFAULT ''");
            database.execSQL("ALTER TABLE AlarmEntity ADD COLUMN downloadStatus TEXT NOT NULL DEFAULT 'PENDING'");
        }
    };

    /* compiled from: AlarmDatabase.kt */
    
    /* loaded from: classes3.dex */
    public static final class Companion {
        public /* synthetic */ Companion(DefaultConstructorMarker defaultConstructorMarker) {
            this();
        }

        private Companion() {
        }

        public final AlarmDatabase getInstance(Context context) {
            AlarmDatabase alarmDatabase;
            Intrinsics.checkNotNullParameter(context, "context");
            AlarmDatabase alarmDatabase2 = AlarmDatabase.INSTANCE;
            if (alarmDatabase2 != null) {
                return alarmDatabase2;
            }
            synchronized (this) {
                Context applicationContext = context.getApplicationContext();
                Intrinsics.checkNotNullExpressionValue(applicationContext, "getApplicationContext(...)");
                alarmDatabase = (AlarmDatabase) Room.databaseBuilder(applicationContext, AlarmDatabase.class, "mantrapuja_alarms.db")
                    .addMigrations(AlarmDatabase.MIGRATION_1_2)
                    .fallbackToDestructiveMigrationOnDowngrade()
                    .build();
                Companion companion = AlarmDatabase.INSTANCE;
                AlarmDatabase.INSTANCE = alarmDatabase;
            }
            return alarmDatabase;
        }
    }
}
