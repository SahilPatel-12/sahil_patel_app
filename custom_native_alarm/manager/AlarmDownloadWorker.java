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
        String id = getInputData().getString("id");
        String downloadUrl = getInputData().getString("url");
        String md5 = getInputData().getString("md5");

        if (id == null || downloadUrl == null) {
            return Result.failure();
        }

        Log.i("AlarmDownloadWorker", "Starting download for alarm ID: " + id + " from URL: " + downloadUrl);

        try {
            Context context = getApplicationContext();
            File destFile = new File(context.getFilesDir(), "alarm_" + id + ".mp3");

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

            Log.i("AlarmDownloadWorker", "Download complete for alarm ID: " + id);

            // Verify MD5 if provided
            if (md5 != null && md5.trim().length() > 0) {
                String calculatedMd5 = calculateFileMd5(destFile);
                if (!calculatedMd5.equalsIgnoreCase(md5)) {
                    Log.e("AlarmDownloadWorker", "MD5 mismatch for alarm ID: " + id + ". Expected: " + md5 + ", Got: " + calculatedMd5);
                    destFile.delete();
                    return Result.failure();
                }
            }

            // Update database
            AlarmDatabase db = AlarmDatabase.INSTANCE.getInstance(context);
            AlarmDao dao = db.alarmDao();
            AlarmEntity alarm = dao.getAlarmById(id);
            if (alarm != null) {
                AlarmEntity updatedAlarm = AlarmEntity.copy$default(
                    alarm, null, null, null, destFile.getAbsolutePath(), true, 
                    0, 0L, null, 0, false, 0.0f, 0, false, false, 
                    0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, 0L, null, null, null, 0L, null, 268435431, null
                );
                dao.updateAlarm(updatedAlarm);
                // Reschedule with the new downloaded file path
                AlarmScheduler.INSTANCE.scheduleAlarm(context, updatedAlarm);
            }

            return Result.success();
        } catch (Exception e) {
            Log.e("AlarmDownloadWorker", "Failed to download alarm file for ID: " + id, e);
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
