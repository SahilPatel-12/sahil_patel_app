package com.mantrapuja.official.alarm.manager;

import android.content.Context;
import android.util.Log;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.ListenableWorker.Result;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.db.AlarmDao;
import com.mantrapuja.official.alarm.engine.AlarmScheduler;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.security.MessageDigest;

public final class AlarmDownloadWorker extends Worker {

    public AlarmDownloadWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        String musicId = getInputData().getString("musicId");
        String downloadUrl = getInputData().getString("url");
        String md5 = getInputData().getString("md5");

        if (musicId == null || downloadUrl == null) {
            return Result.failure();
        }

        Log.i("AlarmDownloadWorker", "Starting download for music ID: " + musicId + " from URL: " + downloadUrl);

        try {
            Context context = getApplicationContext();
            File destFile = new File(context.getFilesDir(), "chant_" + musicId + ".mp3");

            // Download file
            URL url = new URL(downloadUrl);
            InputStream is = new BufferedInputStream(url.openStream());
            FileOutputStream fos = new FileOutputStream(destFile);
            byte[] buffer = new byte[8192];
            int count;
            while ((count = is.read(buffer)) != -1) {
                fos.write(buffer, 0, count);
            }
            fos.flush();
            fos.close();
            is.close();

            Log.i("AlarmDownloadWorker", "Download complete for music ID: " + musicId);

            // Verify MD5 if provided
            if (md5 != null && md5.trim().length() > 0) {
                String calculatedMd5 = calculateFileMd5(destFile);
                if (!calculatedMd5.equalsIgnoreCase(md5)) {
                    Log.e("AlarmDownloadWorker", "MD5 mismatch for music ID: " + musicId + ". Expected: " + md5 + ", Got: " + calculatedMd5);
                    destFile.delete();
                    return Result.failure();
                }
            }

            // Update database for all alarms using this musicId
            AlarmDatabase db = AlarmDatabase.INSTANCE.getInstance(context);
            AlarmDao dao = db.alarmDao();
            java.util.List<AlarmEntity> alarms = dao.getAlarmsByMusicId(musicId);
            for (AlarmEntity alarm : alarms) {
                AlarmEntity updatedAlarm = AlarmEntity.copy$default(
                    alarm, null, null, null, destFile.getAbsolutePath(), true, 
                    0, 0L, null, 0, false, 0.0f, 0, false, false, 
                    0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, 0L, null, null, null, 0L, null, 268435431, null
                );
                updatedAlarm.setDownloadStatus("SUCCESS");
                dao.updateAlarm(updatedAlarm);
                // Reschedule to ensure AlarmManager state is clean
                AlarmScheduler.INSTANCE.scheduleAlarm(context, updatedAlarm);
            }

            return Result.success();
        } catch (Exception e) {
            Log.e("AlarmDownloadWorker", "Failed to download alarm file for music ID: " + musicId, e);
            try {
                Context context = getApplicationContext();
                AlarmDatabase db = AlarmDatabase.INSTANCE.getInstance(context);
                AlarmDao dao = db.alarmDao();
                java.util.List<AlarmEntity> alarms = dao.getAlarmsByMusicId(musicId);
                for (AlarmEntity alarm : alarms) {
                    if (!alarm.isDownloaded()) {
                        alarm.setDownloadStatus("FAILED");
                        dao.updateAlarm(alarm);
                    }
                }
            } catch (Exception dbEx) {
                Log.e("AlarmDownloadWorker", "Failed to update failure status in DB", dbEx);
            }
            return Result.retry();
        }
    }

    private String calculateFileMd5(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        java.io.FileInputStream fis = new java.io.FileInputStream(file);
        byte[] buffer = new byte[8192];
        int count;
        while ((count = fis.read(buffer)) != -1) {
            digest.update(buffer, 0, count);
        }
        fis.close();
        byte[] bytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
