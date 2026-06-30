package com.mantrapuja.official.alarm.ui;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.engine.AlarmActionReceiver;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import kotlin.Metadata;
import kotlin.text.StringsKt;

/* compiled from: AlarmActivity.kt */

/* loaded from: classes3.dex */
public final class AlarmActivity extends Activity {
    private String alarmId;

    @Override // android.app.Activity
    public void onBackPressed() {
    }

    @Override // android.app.Activity
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(6815872);
        }
        this.alarmId = getIntent().getStringExtra("alarm_id");
        float f = getResources().getDisplayMetrics().density;
        int i = getResources().getDisplayMetrics().heightPixels;
        AlarmActivity alarmActivity = this;
        RelativeLayout relativeLayout = new RelativeLayout(alarmActivity);
        relativeLayout.setLayoutParams(new ViewGroup.LayoutParams(-1, -1));
        relativeLayout.setBackgroundColor(Color.parseColor("#852200"));
        LinearLayout linearLayout = new LinearLayout(alarmActivity);
        linearLayout.setId(View.generateViewId());
        linearLayout.setOrientation(1);
        linearLayout.setGravity(1);
        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(-1, -2);
        layoutParams.addRule(10);
        double d = i;
        layoutParams.topMargin = (int) (0.14d * d);
        linearLayout.setLayoutParams(layoutParams);
        String format = new SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Calendar.getInstance().getTime());
        TextView textView = new TextView(alarmActivity);
        textView.setText(format);
        textView.setTextSize(54.0f);
        textView.setTextColor(-1);
        textView.setGravity(17);
        textView.setTypeface(Typeface.create("sans-serif-medium", 1));
        textView.setLayoutParams(new LinearLayout.LayoutParams(-2, -2));
        linearLayout.addView(textView);
        final TextView textView2 = new TextView(alarmActivity);
        textView2.setText("Morning Prayer");
        textView2.setTextSize(18.0f);
        textView2.setTextColor(Color.parseColor("#ffedd5"));
        textView2.setGravity(17);
        textView2.setTypeface(Typeface.DEFAULT);
        LinearLayout.LayoutParams layoutParams2 = new LinearLayout.LayoutParams(-2, -2);
        int i2 = (int) (10 * f);
        layoutParams2.topMargin = i2;
        textView2.setLayoutParams(layoutParams2);
        linearLayout.addView(textView2);
        relativeLayout.addView(linearLayout);
        ImageView imageView = new ImageView(alarmActivity);
        imageView.setId(View.generateViewId());
        RelativeLayout.LayoutParams layoutParams3 = new RelativeLayout.LayoutParams(-1, (int) (d * 0.45d));
        layoutParams3.addRule(12);
        layoutParams3.bottomMargin = i2;
        imageView.setLayoutParams(layoutParams3);
        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        int identifier = imageView.getResources().getIdentifier("alarm_gate", "drawable", getPackageName());
        if (identifier != 0) {
            imageView.setImageResource(identifier);
        }
        relativeLayout.addView(imageView);
        LinearLayout linearLayout2 = new LinearLayout(alarmActivity);
        linearLayout2.setOrientation(1);
        linearLayout2.setGravity(17);
        RelativeLayout.LayoutParams layoutParams4 = new RelativeLayout.LayoutParams(-1, -2);
        layoutParams4.addRule(12);
        layoutParams4.bottomMargin = (int) (32 * f);
        int i3 = (int) (36 * f);
        layoutParams4.leftMargin = i3;
        layoutParams4.rightMargin = i3;
        linearLayout2.setLayoutParams(layoutParams4);
        int i4 = (int) (54 * f);
        Button button = new Button(alarmActivity);
        button.setText("🛕 PRABHU DARSHAN (प्रभु दर्शन)");
        button.setTextSize(15.0f);
        button.setTextColor(Color.parseColor("#78350f"));
        button.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable gradientDrawable = new GradientDrawable();
        gradientDrawable.setColor(Color.parseColor("#fbbf24"));
        float f2 = 27 * f;
        gradientDrawable.setCornerRadius(f2);
        button.setBackground(gradientDrawable);
        LinearLayout.LayoutParams layoutParams5 = new LinearLayout.LayoutParams(-1, i4);
        int i5 = (int) (14 * f);
        layoutParams5.bottomMargin = i5;
        button.setLayoutParams(layoutParams5);
        button.setOnClickListener(new View.OnClickListener() { // from class: com.mantrapuja.official.alarm.ui.AlarmActivity$$ExternalSyntheticLambda0
            @Override // android.view.View.OnClickListener
            public final void onClick(View view) {
                AlarmActivity.this.triggerDarshanAction();
            }
        });
        linearLayout2.addView(button);
        Button button2 = new Button(alarmActivity);
        button2.setText("SNOOZE (10 MINS)");
        button2.setTextSize(15.0f);
        button2.setTextColor(Color.parseColor("#ea580c"));
        button2.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable gradientDrawable2 = new GradientDrawable();
        gradientDrawable2.setColor(-1);
        gradientDrawable2.setCornerRadius(f2);
        button2.setBackground(gradientDrawable2);
        LinearLayout.LayoutParams layoutParams6 = new LinearLayout.LayoutParams(-1, i4);
        layoutParams6.bottomMargin = i5;
        button2.setLayoutParams(layoutParams6);
        button2.setOnClickListener(new View.OnClickListener() { // from class: com.mantrapuja.official.alarm.ui.AlarmActivity$$ExternalSyntheticLambda1
            @Override // android.view.View.OnClickListener
            public final void onClick(View view) {
                AlarmActivity.this.triggerAction("SNOOZE");
            }
        });
        linearLayout2.addView(button2);
        Button button3 = new Button(alarmActivity);
        button3.setText("DISMISS ALARM");
        button3.setTextSize(15.0f);
        button3.setTextColor(-1);
        button3.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable gradientDrawable3 = new GradientDrawable();
        gradientDrawable3.setColor(Color.parseColor("#ef4444"));
        gradientDrawable3.setCornerRadius(f2);
        button3.setBackground(gradientDrawable3);
        button3.setLayoutParams(new LinearLayout.LayoutParams(-1, i4));
        button3.setOnClickListener(new View.OnClickListener() { // from class: com.mantrapuja.official.alarm.ui.AlarmActivity$$ExternalSyntheticLambda2
            @Override // android.view.View.OnClickListener
            public final void onClick(View view) {
                AlarmActivity.this.triggerAction("DISMISS");
            }
        });
        linearLayout2.addView(button3);
        relativeLayout.addView(linearLayout2);
        setContentView(relativeLayout);
        final String str = this.alarmId;
        if (str != null) {
            new Thread(new Runnable() { // from class: com.mantrapuja.official.alarm.ui.AlarmActivity$$ExternalSyntheticLambda3
                @Override // java.lang.Runnable
                public final void run() {
                    AlarmActivity.onCreate$lambda$23$lambda$22(AlarmActivity.this, str, textView2);
                }
            }).start();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void onCreate$lambda$23$lambda$22(AlarmActivity alarmActivity, String str, final TextView textView) {
        final String str2;
        AlarmEntity alarmById = AlarmDatabase.INSTANCE.getInstance(alarmActivity).alarmDao().getAlarmById(str);
        if (alarmById != null) {
            if (alarmById.getLabel().length() <= 0) {
                str2 = "Divine Prayer Call";
            } else {
                str2 = alarmById.getLabel().contains("|") ? alarmById.getLabel().split("\\|")[0] : alarmById.getLabel();
            }
            alarmActivity.runOnUiThread(new Runnable() { // from class: com.mantrapuja.official.alarm.ui.AlarmActivity$$ExternalSyntheticLambda4
                @Override // java.lang.Runnable
                public final void run() {
                    AlarmActivity.onCreate$lambda$23$lambda$22$lambda$21(textView, str2);
                }
            });
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static final void onCreate$lambda$23$lambda$22$lambda$21(TextView textView, String str) {
        textView.setText(str);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public final void triggerAction(String actionName) {
        String str = this.alarmId;
        if (str == null) {
            return;
        }
        Intent intent = new Intent(this, (Class<?>) AlarmActionReceiver.class);
        intent.setAction(actionName);
        intent.putExtra("alarm_id", str);
        sendBroadcast(intent);
        finish();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public final void triggerDarshanAction() {
        String str = this.alarmId;
        if (str != null) {
            Intent intent = new Intent(this, (Class<?>) AlarmActionReceiver.class);
            intent.setAction("DISMISS");
            intent.putExtra("alarm_id", str);
            sendBroadcast(intent);
        }
        Intent intent2 = new Intent("android.intent.action.VIEW", Uri.parse("mantrapuja://god"));
        intent2.setFlags(335544320);
        try {
            startActivity(intent2);
        } catch (Exception e) {
            Log.e("AlarmActivity", "Failed to launch Darshan page deep link", e);
        }
        finish();
    }
}
