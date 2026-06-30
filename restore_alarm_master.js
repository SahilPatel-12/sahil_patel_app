const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = '/Applications/sahil_MP_app/APP/mantrapuja';
const backupDir = path.join(projectRoot, 'custom_native_alarm');
const androidAlarmDir = path.join(projectRoot, 'android/app/src/main/java/com/mantrapuja/official/alarm');
const apkPath = path.join(projectRoot, 'Play Store/Test 7/app-release.apk');
const scratchDir = path.join(projectRoot, 'scratch');

// Room worker source
const javaWorkerCode = `package com.mantrapuja.official.alarm.manager;

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
                    0, 0, 0L, 0, 0, 0.0d, 0.0d, 0L, 0L, null, null, null, 0L, null, 268435439, null
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
`;

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

function stripMetadataFromContent(content) {
  let index = 0;
  while (true) {
    const metadataStart = content.indexOf('@Metadata(', index);
    if (metadataStart === -1) break;

    let openCount = 1;
    let pos = metadataStart + '@Metadata('.length;
    let insideQuotes = false;
    let escape = false;

    while (pos < content.length && openCount > 0) {
      const char = content[pos];
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (!insideQuotes) {
        if (char === '(') {
          openCount++;
        } else if (char === ')') {
          openCount--;
        }
      }
      pos++;
    }

    if (openCount === 0) {
      content = content.slice(0, metadataStart) + content.slice(pos);
      index = metadataStart;
    } else {
      index = metadataStart + 1;
    }
  }
  return content;
}

async function main() {
  console.log('--- Devotional Alarm Restorer Master Script ---');

  // Verify android folder exists
  const androidAppDir = path.join(projectRoot, 'android/app');
  if (!fs.existsSync(androidAppDir)) {
    console.log('Error: android/app directory does not exist. Run "npx expo prebuild" first.');
    process.exit(1);
  }

  // Step 1: Restore or build alarm source files
  if (fs.existsSync(backupDir)) {
    console.log('Found custom native alarm source backup. Copying to android project...');
    if (fs.existsSync(androidAlarmDir)) {
      fs.rmSync(androidAlarmDir, { recursive: true, force: true });
    }
    copyFolderSync(backupDir, androidAlarmDir);
    console.log('Alarm sources restored from backup folder.');
  } else {
    console.log('Backup folder not found. Decompiling source from app-release.apk...');
    const jadxZip = path.join(scratchDir, 'jadx.zip');
    const jadxDir = path.join(scratchDir, 'jadx');
    const decompiledDir = path.join(scratchDir, 'decompiled_src');

    fs.mkdirSync(scratchDir, { recursive: true });

    // Download JADX
    if (!fs.existsSync(jadxZip)) {
      console.log('Downloading JADX...');
      execSync(`curl -L -o "${jadxZip}" https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip`);
    }

    // Unzip JADX
    if (!fs.existsSync(jadxDir)) {
      console.log('Unzipping JADX...');
      fs.mkdirSync(jadxDir, { recursive: true });
      execSync(`unzip -o "${jadxZip}" -d "${jadxDir}"`);
    }

    // Make executable
    execSync(`chmod +x "${path.join(jadxDir, 'bin', 'jadx')}"`);

    // Decompile
    console.log('Decompiling APK...');
    if (fs.existsSync(decompiledDir)) {
      fs.rmSync(decompiledDir, { recursive: true, force: true });
    }
    execSync(`"${path.join(jadxDir, 'bin', 'jadx')}" -r -d "${decompiledDir}" "${apkPath}"`);

    // Copy to androidAlarmDir
    const srcAlarmDir = path.join(decompiledDir, 'sources', 'com', 'mantrapuja', 'official', 'alarm');
    if (!fs.existsSync(srcAlarmDir)) {
      console.log('Error: Decompiled sources not found.');
      process.exit(1);
    }
    if (fs.existsSync(androidAlarmDir)) {
      fs.rmSync(androidAlarmDir, { recursive: true, force: true });
    }
    copyFolderSync(srcAlarmDir, androidAlarmDir);

    // Clean up implementation and closure files
    console.log('Cleaning up decompiled files...');
    execSync(`rm -f "${androidAlarmDir}/db/"*_Impl*`);
    execSync(`rm -f "${androidAlarmDir}/manager/AlarmDownloadWorker$doWork$"*`);
    execSync(`rm -f "${androidAlarmDir}/engine/AlarmService$onStartCommand$"*`);
    execSync(`rm -f "${androidAlarmDir}/engine/BootReceiver$onReceive$"*`);
    execSync(`rm -f "${androidAlarmDir}/utils/AlarmAnalytics$logTrigger$"*`);

    // Strip metadata and fix issues
    function getJavaFiles(dir, files = []) {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          getJavaFiles(fullPath, files);
        } else if (file.endsWith('.java')) {
          files.push(fullPath);
        }
      });
      return files;
    }

    getJavaFiles(androidAlarmDir).forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      content = stripMetadataFromContent(content);
      content = content.replace('import com.google.firebase.messaging.Constants;', '');

      // Specific file patches
      if (file.endsWith('AlarmPlayer.java')) {
        content = content.replace('import androidx.media3.common.AudioAttributes;', '// Removed duplicate import');
        content = content.replace(
          'AudioAttributes build2 = new AudioAttributes.Builder().setUsage(4).setContentType(2).build();',
          'androidx.media3.common.AudioAttributes build2 = new androidx.media3.common.AudioAttributes.Builder().setUsage(4).setContentType(2).build();'
        );
        content = content.replace(
          'AudioAttributes build2 = new AudioAttributes.Builder().setUsage(4).setContentType(4).build();',
          'androidx.media3.common.AudioAttributes build2 = new androidx.media3.common.AudioAttributes.Builder().setUsage(4).setContentType(4).build();'
        );
      } else if (file.endsWith('AlarmBridge.java')) {
        content = content.replace(/Constants\.ScionAnalytics\.PARAM_LABEL/g, '"label"');
        content = content.replace(
          'AlarmBridge.createAlarm$lambda$0(alarmJson, this, promise);',
          'AlarmBridge.createAlarm$lambda$0(alarmJson, AlarmBridge.this, promise);'
        );
        content = content.replace(
          'AlarmBridge.updateAlarm$lambda$1(alarmJson, this, promise);',
          'AlarmBridge.updateAlarm$lambda$1(alarmJson, AlarmBridge.this, promise);'
        );
      } else if (file.endsWith('AlarmDownloadManager.java')) {
        content = content.replace('import com.google.android.gms.common.internal.ImagesContract;', '');
        content = content.replace('ImagesContract.URL', '"url"');
      } else if (file.endsWith('AlarmActionReceiver.java')) {
        content = content.replace('import androidx.media3.exoplayer.hls.playlist.HlsMediaPlaylist;', '');
        content = content.replace('HlsMediaPlaylist.Interstitial.CUE_TRIGGER_ONCE', '"ONCE"');
      } else if (file.endsWith('AlarmScheduler.java')) {
        content = content.replace('import androidx.media3.exoplayer.hls.playlist.HlsMediaPlaylist;', '');
        content = content.replace('HlsMediaPlaylist.Interstitial.CUE_TRIGGER_ONCE', '"ONCE"');
      } else if (file.endsWith('AlarmActivity.java')) {
        content = content.replace(
          'str2 = StringsKt.contains$default((CharSequence) alarmById.getLabel(), (CharSequence) "|", false, 2, (Object) null) ? (String) StringsKt.split$default((CharSequence) alarmById.getLabel(), new String[]{"|"}, false, 0, 6, (Object) null).get(0) : alarmById.getLabel();',
          'str2 = alarmById.getLabel().contains("|") ? alarmById.getLabel().split("\\\\|")[0] : alarmById.getLabel();'
        );
      } else if (file.endsWith('AlarmEntity.java')) {
        let lines = content.split('\n');
        let startIdx = -1;
        let endIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('public final String getId()') && i > 300) {
            startIdx = i;
          }
          if (lines[i].includes('public /* synthetic */ AlarmEntity(') && i > 300) {
            endIdx = i;
          }
        }
        if (startIdx !== -1 && endIdx !== -1) {
          lines.splice(startIdx, endIdx - startIdx);
        }
        content = lines.join('\n');
        content = content.replace('public final boolean getIsDownloaded() {', 'public final boolean isDownloaded() {');
        content = content.replace('public final boolean getIsDownloaded()', 'public final boolean isDownloaded()');
        content = content.replace(
          /public final String getSyncStatus\(\) \{\s+return this\.syncStatus;\s+\}\s+public final long getLastSync\(\) \{\s+return this\.lastSync;\s+\}\s+public final String getDeviceId\(\) \{\s+return this\.deviceId;\s+\}/g,
          ''
        );
      } else if (file.endsWith('AlarmHistoryEntity.java')) {
        let lines = content.split('\n');
        let startIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('public final String getId()') && i > 115) {
            startIdx = i;
            break;
          }
        }
        if (startIdx !== -1) {
          lines.splice(startIdx);
          lines.push('}');
        }
        content = lines.join('\n');
      }

      fs.writeFileSync(file, content, 'utf8');
    });

    // Write Java Worker
    fs.writeFileSync(path.join(androidAlarmDir, 'manager', 'AlarmDownloadWorker.java'), javaWorkerCode, 'utf8');

    // Create permanent backup
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    copyFolderSync(androidAlarmDir, backupDir);
    console.log('Saved permanent backup of custom native alarm code to custom_native_alarm/');

    // Clean scratch
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }

  // Step 2: Apply config changes
  console.log('Applying configuration changes to android files...');

  // MainApplication.kt
  const mainAppPath = path.join(androidAppDir, 'src/main/java/com/mantrapuja/official/MainApplication.kt');
  if (fs.existsSync(mainAppPath)) {
    let content = fs.readFileSync(mainAppPath, 'utf8');
    if (!content.includes('com.mantrapuja.official.alarm.AlarmPackage()')) {
      content = content.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(com.mantrapuja.official.alarm.AlarmPackage())'
      );
      fs.writeFileSync(mainAppPath, content, 'utf8');
      console.log('Registered AlarmPackage in MainApplication.kt');
    }
  }

  // build.gradle (dependencies)
  const buildGradlePath = path.join(androidAppDir, 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    if (!content.includes('kotlin-kapt')) {
      content = content.replace(
        'apply plugin: "org.jetbrains.kotlin.android"',
        'apply plugin: "org.jetbrains.kotlin.android"\napply plugin: "kotlin-kapt"'
      );
    }
    if (!content.includes('androidx.room:room-runtime')) {
      const roomDeps = `
    // Room Database
    def room_version = "2.8.4"
    implementation "androidx.room:room-runtime:$room_version"
    implementation "androidx.room:room-ktx:$room_version"
    kapt "androidx.room:room-compiler:$room_version"

    // WorkManager
    def work_version = "2.9.0"
    implementation "androidx.work:work-runtime-ktx:$work_version"

    // Media3 ExoPlayer
    def media3_version = "1.2.1"
    implementation "androidx.media3:media3-exoplayer:$media3_version"
    implementation "androidx.media3:media3-session:$media3_version"
      `;
      content = content.replace(
        'dependencies {',
        `dependencies {${roomDeps}`
      );
    }
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    console.log('Added dependencies to build.gradle');
  }

  // AlarmDatabase.java double instance fix
  const dbPath = path.join(androidAlarmDir, 'db/AlarmDatabase.java');
  if (fs.existsSync(dbPath)) {
    let content = fs.readFileSync(dbPath, 'utf8');
    if (content.includes('private static volatile AlarmDatabase INSTANCE;')) {
      content = content.replace('private static volatile AlarmDatabase INSTANCE;', 'private static volatile AlarmDatabase instance;');
      content = content.replace('AlarmDatabase.INSTANCE;', 'AlarmDatabase.instance;');
      content = content.replace('AlarmDatabase.INSTANCE = alarmDatabase;', 'AlarmDatabase.instance = alarmDatabase;');
      fs.writeFileSync(dbPath, content, 'utf8');
      console.log('Fixed duplicate INSTANCE in AlarmDatabase.java');
    }
  }

  // AlarmPackage.java signature fix
  const pkgPath = path.join(androidAlarmDir, 'AlarmPackage.java');
  if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    content = content.replace('List<ViewManager<?, ?>>', 'List<ViewManager>');
    fs.writeFileSync(pkgPath, content, 'utf8');
    console.log('Fixed ViewManager signature in AlarmPackage.java');
  }

  // AndroidManifest.xml
  const manifestPath = path.join(androidAppDir, 'src/main/AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let content = fs.readFileSync(manifestPath, 'utf8');
    if (!content.includes('SCHEDULE_EXACT_ALARM')) {
      // Add permissions
      const perms = `
  <!-- Persistent Devotional Alarm Permissions -->
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
  <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
      `;
      content = content.replace(
        '<uses-permission android:name="android.permission.INTERNET"/>',
        `<uses-permission android:name="android.permission.INTERNET"/>\n${perms}`
      );
    }
    if (!content.includes('.alarm.engine.AlarmReceiver')) {
      // Add receivers/service/activity
      const components = `
    <!-- Devotional Alarms components -->
    <receiver android:name=".alarm.engine.AlarmReceiver" android:exported="false" />
    <receiver android:name=".alarm.engine.AlarmActionReceiver" android:exported="false" />
    <receiver android:name=".alarm.engine.BootReceiver" android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.BOOT_COMPLETED" />
        </intent-filter>
    </receiver>
    
    <service 
        android:name=".alarm.engine.AlarmService" 
        android:exported="false"
        android:foregroundServiceType="mediaPlayback" />
        
    <activity 
        android:name=".alarm.ui.AlarmActivity"
        android:exported="false"
        android:showOnLockScreen="true"
        android:showWhenLocked="true"
        android:turnScreenOn="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar" />
      `;
      content = content.replace(
        '</application>',
        `${components}\n  </application>`
      );
    }
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('Configured permissions and receivers in AndroidManifest.xml');
  }

  // proguard-rules.pro
  const proguardPath = path.join(androidAppDir, 'proguard-rules.pro');
  if (fs.existsSync(proguardPath)) {
    let content = fs.readFileSync(proguardPath, 'utf8');
    if (!content.includes('com.mantrapuja.official.alarm')) {
      content += `
# Devotional Alarms Keep Rules
-keep class com.mantrapuja.official.alarm.** { *; }
`;
      fs.writeFileSync(proguardPath, content, 'utf8');
      console.log('Configured ProGuard keep rules');
    }
  }

  console.log('--- Restore Alarm Configuration Complete! ---');
}

main();
