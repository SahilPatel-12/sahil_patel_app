package com.mantrapuja.official.alarm.ui;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.OvershootInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.mantrapuja.official.alarm.db.AlarmDatabase;
import com.mantrapuja.official.alarm.db.AlarmEntity;
import com.mantrapuja.official.alarm.engine.AlarmActionReceiver;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import kotlin.jvm.internal.Intrinsics;

public final class AlarmActivity extends Activity {
    private String alarmId;
    private Vibrator vibrator;

    // UI Elements
    private TextView timeView;
    private TextView dateView;
    private TextView labelView;
    
    private RelativeLayout sliderContainer;
    private ImageView leftTarget;
    private ImageView rightTarget;
    private ImageView topTarget;
    private ImageView handleView;
    private TextView leftLabel;
    private TextView rightLabel;
    private TextView topLabel;
    
    private View fadeOverlay;
    private FrameLayout gateOverlay;
    private View radialGlow;
    private FrameLayout leftDoor;
    private FrameLayout rightDoor;
    private ImageView leftDoorImage;
    private ImageView rightDoorImage;

    // Constants
    private static final float HANDLE_SIZE_DP = 66f;
    private static final float TARGET_SIZE_DP = 60f;
    private static final float DRAG_RADIUS_DP = 110f;
    private static final float ACTIVATION_RADIUS_DP = 45f;
    private static final int PREPARE_DELAY_MS = 400;

    // State Machine
    private enum AnimationState {
        IDLE,
        DRAGGING,
        TARGET_HOVER,
        DARSHAN_SELECTED,
        PREPARING,
        GATE_APPEARING,
        GATE_OPENING,
        ENTERING_GATE,
        NAVIGATING,
        FINISHED
    }
    
    private AnimationState currentState = AnimationState.IDLE;

    private void transitionTo(AnimationState newState) {
        Log.i("AlarmActivity", "State transition: " + currentState + " -> " + newState);
        currentState = newState;
    }

    @Override
    public void onBackPressed() {
        // Disable back button on alarm ringing screen
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUI();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set fullscreen and lock screen flags
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        this.alarmId = getIntent().getStringExtra("alarm_id");
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        // Density scale conversions
        final float density = getResources().getDisplayMetrics().density;
        final int screenHeight = getResources().getDisplayMetrics().heightPixels;
        final int screenWidth = getResources().getDisplayMetrics().widthPixels;
        
        final int iconPadding = (int) (18 * density);

        // Root FrameLayout
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(-1, -1));
        rootLayout.setBackgroundColor(Color.BLACK);

        // ==========================================
        // Layer 1: Alarm Information
        // ==========================================
        LinearLayout infoLayout = new LinearLayout(this);
        infoLayout.setOrientation(LinearLayout.VERTICAL);
        infoLayout.setGravity(Gravity.CENTER_HORIZONTAL);
        FrameLayout.LayoutParams infoParams = new FrameLayout.LayoutParams(-1, -2);
        infoParams.topMargin = (int) (screenHeight * 0.12f);
        infoLayout.setLayoutParams(infoParams);

        String timeText = new SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Calendar.getInstance().getTime());
        timeView = new TextView(this);
        timeView.setText(timeText);
        timeView.setTextSize(60.0f);
        timeView.setTextColor(Color.WHITE);
        timeView.setGravity(Gravity.CENTER);
        timeView.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
        infoLayout.addView(timeView);

        String dateText = new SimpleDateFormat("EEEE, MMMM d", Locale.getDefault()).format(Calendar.getInstance().getTime());
        dateView = new TextView(this);
        dateView.setText(dateText);
        dateView.setTextSize(16.0f);
        dateView.setTextColor(Color.parseColor("#a1a1aa")); // Neutral light gray
        dateView.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams dateParams = new LinearLayout.LayoutParams(-2, -2);
        dateParams.topMargin = (int) (8 * density);
        dateView.setLayoutParams(dateParams);
        infoLayout.addView(dateView);

        labelView = new TextView(this);
        labelView.setTextSize(18.0f);
        labelView.setTextColor(Color.parseColor("#ffedd5")); // Devotional warm orange/white
        labelView.setGravity(Gravity.CENTER);
        labelView.setTypeface(Typeface.DEFAULT);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(-2, -2);
        labelParams.topMargin = (int) (18 * density);
        labelView.setLayoutParams(labelParams);
        infoLayout.addView(labelView);

        rootLayout.addView(infoLayout);

        // ==========================================
        // Layer 2: Gesture Slider
        // ==========================================
        sliderContainer = new RelativeLayout(this);
        FrameLayout.LayoutParams sliderParams = new FrameLayout.LayoutParams((int) (320 * density), (int) (320 * density));
        sliderParams.gravity = Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM;
        sliderParams.bottomMargin = (int) (64 * density);
        sliderContainer.setLayoutParams(sliderParams);

        // Left Target: Snooze (💤)
        leftTarget = new ImageView(this);
        leftTarget.setId(View.generateViewId());
        leftTarget.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        leftTarget.setPadding(iconPadding, iconPadding, iconPadding, iconPadding);
        GradientDrawable leftBg = new GradientDrawable();
        leftBg.setShape(GradientDrawable.OVAL);
        leftBg.setColor(Color.parseColor("#26ffffff")); // 15% opacity white
        leftTarget.setBackground(leftBg);
        RelativeLayout.LayoutParams leftParams = new RelativeLayout.LayoutParams((int) (TARGET_SIZE_DP * density), (int) (TARGET_SIZE_DP * density));
        leftParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        leftParams.addRule(RelativeLayout.CENTER_VERTICAL);
        leftParams.leftMargin = (int) (10 * density);
        leftTarget.setLayoutParams(leftParams);
        sliderContainer.addView(leftTarget);

        leftLabel = new TextView(this);
        leftLabel.setText("Snooze");
        leftLabel.setTextSize(12.0f);
        leftLabel.setTextColor(Color.parseColor("#a1a1aa")); // Neutral light gray
        leftLabel.setGravity(Gravity.CENTER);
        leftLabel.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        RelativeLayout.LayoutParams leftLabelParams = new RelativeLayout.LayoutParams((int) (100 * density), -2);
        leftLabelParams.addRule(RelativeLayout.BELOW, leftTarget.getId());
        leftLabelParams.addRule(RelativeLayout.ALIGN_LEFT, leftTarget.getId());
        leftLabelParams.addRule(RelativeLayout.ALIGN_RIGHT, leftTarget.getId());
        leftLabelParams.leftMargin = (int) (-20 * density);
        leftLabelParams.rightMargin = (int) (-20 * density);
        leftLabelParams.topMargin = (int) (6 * density);
        leftLabel.setLayoutParams(leftLabelParams);
        sliderContainer.addView(leftLabel);

        // Right Target: Dismiss (🔕)
        rightTarget = new ImageView(this);
        rightTarget.setId(View.generateViewId());
        rightTarget.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        rightTarget.setPadding(iconPadding, iconPadding, iconPadding, iconPadding);
        GradientDrawable rightBg = new GradientDrawable();
        rightBg.setShape(GradientDrawable.OVAL);
        rightBg.setColor(Color.parseColor("#26ffffff"));
        rightTarget.setBackground(rightBg);
        RelativeLayout.LayoutParams rightParams = new RelativeLayout.LayoutParams((int) (TARGET_SIZE_DP * density), (int) (TARGET_SIZE_DP * density));
        rightParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        rightParams.addRule(RelativeLayout.CENTER_VERTICAL);
        rightParams.rightMargin = (int) (10 * density);
        rightTarget.setLayoutParams(rightParams);
        sliderContainer.addView(rightTarget);

        rightLabel = new TextView(this);
        rightLabel.setText("Dismiss");
        rightLabel.setTextSize(12.0f);
        rightLabel.setTextColor(Color.parseColor("#a1a1aa"));
        rightLabel.setGravity(Gravity.CENTER);
        rightLabel.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        RelativeLayout.LayoutParams rightLabelParams = new RelativeLayout.LayoutParams((int) (100 * density), -2);
        rightLabelParams.addRule(RelativeLayout.BELOW, rightTarget.getId());
        rightLabelParams.addRule(RelativeLayout.ALIGN_LEFT, rightTarget.getId());
        rightLabelParams.addRule(RelativeLayout.ALIGN_RIGHT, rightTarget.getId());
        rightLabelParams.leftMargin = (int) (-20 * density);
        rightLabelParams.rightMargin = (int) (-20 * density);
        rightLabelParams.topMargin = (int) (6 * density);
        rightLabel.setLayoutParams(rightLabelParams);
        sliderContainer.addView(rightLabel);

        // Top Target: Prabhu Darshan (🛕)
        topTarget = new ImageView(this);
        topTarget.setId(View.generateViewId());
        topTarget.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        topTarget.setPadding(iconPadding, iconPadding, iconPadding, iconPadding);
        GradientDrawable topBg = new GradientDrawable();
        topBg.setShape(GradientDrawable.OVAL);
        topBg.setColor(Color.parseColor("#26ffffff"));
        topTarget.setBackground(topBg);
        RelativeLayout.LayoutParams topParams = new RelativeLayout.LayoutParams((int) (TARGET_SIZE_DP * density), (int) (TARGET_SIZE_DP * density));
        topParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        topParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        topParams.topMargin = (int) (10 * density);
        topTarget.setLayoutParams(topParams);
        sliderContainer.addView(topTarget);

        topLabel = new TextView(this);
        topLabel.setText("Darshan");
        topLabel.setTextSize(12.0f);
        topLabel.setTextColor(Color.parseColor("#a1a1aa"));
        topLabel.setGravity(Gravity.CENTER);
        topLabel.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        RelativeLayout.LayoutParams topLabelParams = new RelativeLayout.LayoutParams((int) (100 * density), -2);
        topLabelParams.addRule(RelativeLayout.BELOW, topTarget.getId());
        topLabelParams.addRule(RelativeLayout.ALIGN_LEFT, topTarget.getId());
        topLabelParams.addRule(RelativeLayout.ALIGN_RIGHT, topTarget.getId());
        topLabelParams.leftMargin = (int) (-20 * density);
        topLabelParams.rightMargin = (int) (-20 * density);
        topLabelParams.topMargin = (int) (6 * density);
        topLabel.setLayoutParams(topLabelParams);
        sliderContainer.addView(topLabel);

        // Center Handle: (⏰)
        handleView = new ImageView(this);
        handleView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        handleView.setPadding((int) (20 * density), (int) (20 * density), (int) (20 * density), (int) (20 * density));
        GradientDrawable handleBg = new GradientDrawable();
        handleBg.setShape(GradientDrawable.OVAL);
        handleBg.setColor(Color.WHITE);
        handleView.setBackground(handleBg);
        if (Build.VERSION.SDK_INT >= 21) {
            handleView.setElevation(8 * density);
        }
        RelativeLayout.LayoutParams handleParams = new RelativeLayout.LayoutParams((int) (HANDLE_SIZE_DP * density), (int) (HANDLE_SIZE_DP * density));
        handleParams.addRule(RelativeLayout.CENTER_IN_PARENT);
        handleView.setLayoutParams(handleParams);
        sliderContainer.addView(handleView);

        rootLayout.addView(sliderContainer);

        // ==========================================
        // Layer 3: Transition Overlay
        // ==========================================
        fadeOverlay = new View(this);
        fadeOverlay.setLayoutParams(new ViewGroup.LayoutParams(-1, -1));
        fadeOverlay.setBackgroundColor(Color.BLACK);
        fadeOverlay.setAlpha(0f);
        rootLayout.addView(fadeOverlay);

        // ==========================================
        // Layer 4: Cinematic Temple Overlay
        // ==========================================
        gateOverlay = new FrameLayout(this);
        gateOverlay.setLayoutParams(new ViewGroup.LayoutParams(-1, -1));
        gateOverlay.setVisibility(View.GONE);

        // Behind-Gate Radial Glow View
        radialGlow = new View(this);
        FrameLayout.LayoutParams glowParams = new FrameLayout.LayoutParams((int) (300 * density), (int) (300 * density));
        glowParams.gravity = Gravity.CENTER;
        radialGlow.setLayoutParams(glowParams);
        GradientDrawable glowBg = new GradientDrawable();
        glowBg.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        glowBg.setGradientRadius(150 * density);
        glowBg.setColors(new int[]{Color.parseColor("#ffb900"), Color.TRANSPARENT});
        radialGlow.setBackground(glowBg);
        radialGlow.setAlpha(0f);
        gateOverlay.addView(radialGlow);

        // Split-Gate container (simulates double doors opening outwards)
        final FrameLayout gateContainer = new FrameLayout(this);
        FrameLayout.LayoutParams containerParams = new FrameLayout.LayoutParams(screenWidth, (int) (screenWidth * 1.25f));
        containerParams.gravity = Gravity.CENTER;
        gateContainer.setLayoutParams(containerParams);

        // Left Door Container
        leftDoor = new FrameLayout(this);
        leftDoor.setClipChildren(true);
        FrameLayout.LayoutParams leftDoorParams = new FrameLayout.LayoutParams(screenWidth / 2, -1);
        leftDoorParams.gravity = Gravity.LEFT;
        leftDoor.setLayoutParams(leftDoorParams);

        leftDoorImage = new ImageView(this);
        leftDoorImage.setScaleType(ImageView.ScaleType.FIT_XY);
        leftDoorImage.setLayoutParams(new FrameLayout.LayoutParams(screenWidth, -1));
        leftDoor.addView(leftDoorImage);
        gateContainer.addView(leftDoor);

        // Right Door Container
        rightDoor = new FrameLayout(this);
        rightDoor.setClipChildren(true);
        FrameLayout.LayoutParams rightDoorParams = new FrameLayout.LayoutParams(screenWidth / 2, -1);
        rightDoorParams.gravity = Gravity.RIGHT;
        rightDoor.setLayoutParams(rightDoorParams);

        rightDoorImage = new ImageView(this);
        rightDoorImage.setScaleType(ImageView.ScaleType.FIT_XY);
        rightDoorImage.setLayoutParams(new FrameLayout.LayoutParams(screenWidth, -1));
        rightDoorImage.setTranslationX(-screenWidth / 2f); // Offset to show the right half
        rightDoor.addView(rightDoorImage);
        gateContainer.addView(rightDoor);

        gateOverlay.addView(gateContainer);
        rootLayout.addView(gateOverlay);

        setContentView(rootLayout);

        // Load Gate Image Assets
        int gateResId = getResources().getIdentifier("alarm_gate", "drawable", getPackageName());
        if (gateResId != 0) {
            leftDoorImage.setImageResource(gateResId);
            rightDoorImage.setImageResource(gateResId);
        }

        // Set Vector Drawable Icons
        leftTarget.setImageResource(getResources().getIdentifier("ic_alarm_snooze", "drawable", getPackageName()));
        rightTarget.setImageResource(getResources().getIdentifier("ic_alarm_dismiss", "drawable", getPackageName()));
        topTarget.setImageResource(getResources().getIdentifier("ic_alarm_darshan", "drawable", getPackageName()));
        handleView.setImageResource(getResources().getIdentifier("ic_alarm_handle", "drawable", getPackageName()));

        // Fetch alarm label
        loadAlarmLabel();

        // Configure touch interactions
        handleView.setOnTouchListener(new View.OnTouchListener() {
            private float startX = 0;
            private float startY = 0;
            private float initialX = 0;
            private float initialY = 0;
            private boolean isDragging = false;
            private int currentHoverState = -1; // -1: none, 0: left, 1: right, 2: top

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                // Ignore all touches once lock sequence begins
                if (currentState.ordinal() >= AnimationState.DARSHAN_SELECTED.ordinal()) {
                    return false;
                }

                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        startX = event.getRawX();
                        startY = event.getRawY();
                        initialX = handleView.getX();
                        initialY = handleView.getY();
                        isDragging = true;

                        transitionTo(AnimationState.DRAGGING);

                        // Scale up the handle dynamically
                        handleView.animate().scaleX(1.15f).scaleY(1.15f).setDuration(150).start();
                        triggerHaptic(20);
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        if (!isDragging) return false;

                        float dx = event.getRawX() - startX;
                        float dy = event.getRawY() - startY;

                        // Drag Radius Constraint (Polar boundary)
                        float maxRadius = DRAG_RADIUS_DP * density;
                        float currentRadius = (float) Math.sqrt(dx * dx + dy * dy);
                        if (currentRadius > maxRadius) {
                            dx = (dx / currentRadius) * maxRadius;
                            dy = (dy / currentRadius) * maxRadius;
                        }

                        handleView.setTranslationX(dx);
                        handleView.setTranslationY(dy);

                        // Position check for hover activation
                        float handleCenterX = handleView.getLeft() + handleView.getWidth() / 2f + dx;
                        float handleCenterY = handleView.getTop() + handleView.getHeight() / 2f + dy;

                        float leftCenterX = leftTarget.getLeft() + leftTarget.getWidth() / 2f;
                        float leftCenterY = leftTarget.getTop() + leftTarget.getHeight() / 2f;

                        float rightCenterX = rightTarget.getLeft() + rightTarget.getWidth() / 2f;
                        float rightCenterY = rightTarget.getTop() + rightTarget.getHeight() / 2f;

                        float topCenterX = topTarget.getLeft() + topTarget.getWidth() / 2f;
                        float topCenterY = topTarget.getTop() + topTarget.getHeight() / 2f;

                        float distLeft = (float) Math.sqrt(Math.pow(handleCenterX - leftCenterX, 2) + Math.pow(handleCenterY - leftCenterY, 2));
                        float distRight = (float) Math.sqrt(Math.pow(handleCenterX - rightCenterX, 2) + Math.pow(handleCenterY - rightCenterY, 2));
                        float distTop = (float) Math.sqrt(Math.pow(handleCenterX - topCenterX, 2) + Math.pow(handleCenterY - topCenterY, 2));

                        float activationThreshold = ACTIVATION_RADIUS_DP * density;
                        int newHoverState = -1;

                        if (distLeft < activationThreshold) {
                            newHoverState = 0;
                        } else if (distRight < activationThreshold) {
                            newHoverState = 1;
                        } else if (distTop < activationThreshold) {
                            newHoverState = 2;
                        }

                        if (newHoverState != currentHoverState) {
                            currentHoverState = newHoverState;
                            transitionTo(currentHoverState == -1 ? AnimationState.DRAGGING : AnimationState.TARGET_HOVER);
                            updateTargetHighlights(currentHoverState);
                        }

                        return true;

                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (!isDragging) return false;
                        isDragging = false;

                        int finalActionState = currentHoverState;
                        currentHoverState = -1;
                        updateTargetHighlights(-1);

                        // Reset handle scale
                        handleView.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start();

                        if (finalActionState == 0) {
                            triggerHaptic(100);
                            triggerAction("SNOOZE");
                        } else if (finalActionState == 1) {
                            triggerHaptic(100);
                            triggerAction("DISMISS");
                        } else if (finalActionState == 2) {
                            startDarshanCinematic(gateContainer);
                        } else {
                            // Spring Return Animation (bouncy overshoot back to center)
                            transitionTo(AnimationState.IDLE);
                            handleView.animate()
                                    .translationX(0)
                                    .translationY(0)
                                    .setDuration(280)
                                    .setInterpolator(new OvershootInterpolator(1.8f))
                                    .start();
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void updateTargetHighlights(int hoverState) {
        resetTargetView(leftTarget);
        resetTargetView(rightTarget);
        resetTargetView(topTarget);

        if (hoverState == 0) {
            highlightTargetView(leftTarget);
        } else if (hoverState == 1) {
            highlightTargetView(rightTarget);
        } else if (hoverState == 2) {
            highlightTargetView(topTarget);
        }
    }

    private void resetTargetView(ImageView target) {
        target.animate().scaleX(1.0f).scaleY(1.0f).alpha(1.0f).setDuration(150).start();
        GradientDrawable gd = (GradientDrawable) target.getBackground();
        if (gd != null) {
            gd.setColor(Color.parseColor("#26ffffff"));
        }
    }

    private void highlightTargetView(ImageView target) {
        target.animate().scaleX(1.25f).scaleY(1.25f).alpha(1.0f).setDuration(150).start();
        GradientDrawable gd = (GradientDrawable) target.getBackground();
        if (gd != null) {
            gd.setColor(Color.parseColor("#66ffffff"));
        }
        triggerHaptic(20);
    }

    private void triggerHaptic(int duration) {
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(duration);
            }
        }
    }

    private boolean isReduceMotionEnabled() {
        if (Build.VERSION.SDK_INT >= 17) {
            try {
                float transitionScale = Settings.Global.getFloat(getContentResolver(), Settings.Global.TRANSITION_ANIMATION_SCALE);
                float animatorScale = Settings.Global.getFloat(getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE);
                return transitionScale == 0f || animatorScale == 0f;
            } catch (Exception e) {
                // ignore settings fetch failures
            }
        }
        return false;
    }

    private void startDarshanCinematic(final FrameLayout gateContainer) {
        transitionTo(AnimationState.DARSHAN_SELECTED);
        triggerHaptic(120);

        handleView.setOnTouchListener(null); // Disable further touch interactions

        // Animate locking: move handle to targets top center position
        float targetX = topTarget.getX() + (topTarget.getWidth() - handleView.getWidth()) / 2f;
        float targetY = topTarget.getY() + (topTarget.getHeight() - handleView.getHeight()) / 2f;

        // Fade out Snooze and Dismiss target overlays and labels
        leftTarget.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(250).start();
        rightTarget.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(250).start();
        if (leftLabel != null) leftLabel.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(250).start();
        if (rightLabel != null) rightLabel.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(250).start();

        handleView.animate()
                .x(targetX)
                .y(targetY)
                .setDuration(250)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        // Clear the listener on handleView animator immediately to prevent duplicates
                        handleView.animate().setListener(null);
                        
                        // Fade handle and lock target out
                        topTarget.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(200).start();
                        if (topLabel != null) topLabel.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(200).start();
                        handleView.animate().alpha(0f).scaleX(0.5f).scaleY(0.5f).setDuration(200).setListener(new AnimatorListenerAdapter() {
                            @Override
                            public void onAnimationEnd(Animator anim) {
                                // Clear the listener
                                handleView.animate().setListener(null);
                                
                                // Stage 2: Preparing Darshan (300-500ms sacred pause)
                                transitionTo(AnimationState.PREPARING);
                                
                                if (isReduceMotionEnabled()) {
                                    // Accessibility: skip complex animations, fade straight to transition
                                    fadeOverlay.animate().alpha(1.0f).setDuration(200).start();
                                    gateOverlay.setVisibility(View.VISIBLE);
                                    radialGlow.setAlpha(1.0f);
                                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                        @Override
                                        public void run() {
                                            transitionTo(AnimationState.NAVIGATING);
                                            triggerDarshanAction();
                                        }
                                    }, 400);
                                    return;
                                }

                                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                    @Override
                                    public void run() {
                                        runGateOpeningSequence(gateContainer);
                                    }
                                }, PREPARE_DELAY_MS);
                            }
                        }).start();
                    }
                }).start();
    }

    private void runGateOpeningSequence(final FrameLayout gateContainer) {
        transitionTo(AnimationState.GATE_APPEARING);

        // Stage 3: Gate Appearance & Camera Zoom
        gateOverlay.setVisibility(View.VISIBLE);
        gateContainer.setScaleX(0.8f);
        gateContainer.setScaleY(0.8f);
        gateContainer.setAlpha(0f);

        fadeOverlay.animate().alpha(0.6f).setDuration(800).start();

        gateContainer.animate()
                .alpha(1.0f)
                .scaleX(1.0f)
                .scaleY(1.0f)
                .setDuration(800)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        // Clear the listener to prevent recursion on next animate() call
                        gateContainer.animate().setListener(null);

                        // Stage 4: Gate Splitting & Swing Opening (3D Rotate Y)
                        transitionTo(AnimationState.GATE_OPENING);

                        // Set swing pivots to outer edges of left/right doors
                        leftDoor.setPivotX(0f);
                        leftDoor.setPivotY(leftDoor.getHeight() / 2f);

                        rightDoor.setPivotX(rightDoor.getWidth());
                        rightDoor.setPivotY(rightDoor.getHeight() / 2f);

                        // Left door translations and 3D Y rotation
                        ObjectAnimator leftTranslate = ObjectAnimator.ofFloat(leftDoor, "translationX", 0f, -leftDoor.getWidth());
                        ObjectAnimator leftRotate = ObjectAnimator.ofFloat(leftDoor, "rotationY", 0f, -75f);

                        // Right door translations and 3D Y rotation
                        ObjectAnimator rightTranslate = ObjectAnimator.ofFloat(rightDoor, "translationX", 0f, rightDoor.getWidth());
                        ObjectAnimator rightRotate = ObjectAnimator.ofFloat(rightDoor, "rotationY", 0f, 75f);

                        // Intensify radial golden glow
                        ObjectAnimator glowAlpha = ObjectAnimator.ofFloat(radialGlow, "alpha", 0f, 1.0f);
                        ObjectAnimator glowScaleX = ObjectAnimator.ofFloat(radialGlow, "scaleX", 1.0f, 1.6f);
                        ObjectAnimator glowScaleY = ObjectAnimator.ofFloat(radialGlow, "scaleY", 1.0f, 1.6f);

                        AnimatorSet doorSet = new AnimatorSet();
                        doorSet.playTogether(leftTranslate, leftRotate, rightTranslate, rightRotate, glowAlpha, glowScaleX, glowScaleY);
                        doorSet.setDuration(2200);
                        doorSet.setInterpolator(new AccelerateDecelerateInterpolator());
                        doorSet.addListener(new AnimatorListenerAdapter() {
                            @Override
                            public void onAnimationEnd(Animator anim) {
                                // Stage 5: Entering the Temple (Zoom through)
                                transitionTo(AnimationState.ENTERING_GATE);

                                // Fast scale-up zoom past the gates (Set listener to null explicitly to prevent loops)
                                gateContainer.animate()
                                        .scaleX(2.5f)
                                        .scaleY(2.5f)
                                        .alpha(0f)
                                        .setDuration(1500)
                                        .setInterpolator(new AccelerateInterpolator())
                                        .setListener(null)
                                        .start();

                                // Expand glow to full screen coverage
                                radialGlow.animate()
                                        .scaleX(4.5f)
                                        .scaleY(4.5f)
                                        .setDuration(1500)
                                        .setListener(new AnimatorListenerAdapter() {
                                            @Override
                                            public void onAnimationEnd(Animator anim2) {
                                                radialGlow.animate().setListener(null); // Clear listener
                                                
                                                // Stage 6: Navigation
                                                transitionTo(AnimationState.NAVIGATING);
                                                triggerDarshanAction();
                                            }
                                        }).start();
                            }
                        });
                        doorSet.start();
                    }
                }).start();

        radialGlow.animate().alpha(0.5f).setDuration(800).start();
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= 19) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    private void loadAlarmLabel() {
        final String str = this.alarmId;
        if (str == null) {
            labelView.setText("Divine Prayer Call");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                AlarmEntity alarmById = AlarmDatabase.INSTANCE.getInstance(AlarmActivity.this).alarmDao().getAlarmById(str);
                final String labelText;
                if (alarmById != null) {
                    if (alarmById.getLabel().length() <= 0) {
                        labelText = "Divine Prayer Call";
                    } else {
                        labelText = alarmById.getLabel().contains("|") ? alarmById.getLabel().split("\\|")[0] : alarmById.getLabel();
                    }
                } else {
                    labelText = "Divine Prayer Call";
                }

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        labelView.setText(labelText);
                    }
                });
            }
        }).start();
    }

    private void triggerAction(String actionName) {
        String str = this.alarmId;
        if (str == null) {
            return;
        }
        Intent intent = new Intent(this, (Class<?>) AlarmActionReceiver.class);
        intent.setAction(actionName);
        intent.putExtra("alarm_id", str);
        sendBroadcast(intent);
        transitionTo(AnimationState.FINISHED);
        finish();
    }

    private void triggerDarshanAction() {
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
            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launchIntent != null) {
                startActivity(launchIntent);
            }
        }
        transitionTo(AnimationState.FINISHED);
        finish();
    }
}
