package com.mantrapuja.official.alarm.utils;

import java.util.Calendar;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: SolarCalculator.kt */

/* loaded from: classes3.dex */
public final class SolarCalculator {
    public static final SolarCalculator INSTANCE = new SolarCalculator();

    private final double normalise(double value, double max) {
        while (value < 0.0d) {
            value += max;
        }
        while (value >= max) {
            value -= max;
        }
        return value;
    }

    private SolarCalculator() {
    }

    public final long calculateSolarEvent(Calendar calendar, String type, double latitude, double longitude) {
        Intrinsics.checkNotNullParameter(calendar, "calendar");
        Intrinsics.checkNotNullParameter(type, "type");
        double offset = calendar.getTimeZone().getOffset(calendar.getTimeInMillis()) / 3600000.0d;
        int i = calendar.get(6);
        double radians = Math.toRadians(latitude);
        double d = longitude / 15.0d;
        double d2 = i + (((Intrinsics.areEqual(type, "SUNSET") ? 18.0d : 6.0d) - d) / 24.0d);
        double d3 = (0.9856d * d2) - 3.289d;
        double normalise = normalise(d3 + (Math.sin(Math.toRadians(d3)) * 1.916d) + (Math.sin(Math.toRadians(d3 * 2.0d)) * 0.02d) + 282.634d, 360.0d);
        double normalise2 = normalise(Math.toDegrees(Math.atan(Math.tan(Math.toRadians(normalise)) * 0.91764d)), 360.0d);
        double floor = (normalise2 + ((Math.floor(normalise / 90.0d) * 90.0d) - (Math.floor(normalise2 / 90.0d) * 90.0d))) / 15.0d;
        double sin = Math.sin(Math.toRadians(normalise)) * 0.39782d;
        double cos = (Math.cos(Math.toRadians(90.833d)) - (sin * Math.sin(radians))) / (Math.cos(Math.asin(sin)) * Math.cos(radians));
        if (cos > 1.0d || cos < -1.0d) {
            Calendar calendar2 = Calendar.getInstance();
            calendar2.setTimeInMillis(calendar.getTimeInMillis());
            calendar2.set(11, Intrinsics.areEqual(type, "SUNSET") ? 18 : 6);
            calendar2.set(12, 0);
            calendar2.set(13, 0);
            calendar2.set(14, 0);
            return calendar2.getTimeInMillis();
        }
        boolean areEqual = Intrinsics.areEqual(type, "SUNSET");
        double acos = Math.acos(cos);
        if (!areEqual) {
            acos = 360.0d - acos;
        }
        double normalise3 = normalise((normalise(((((Math.toDegrees(acos) / 15.0d) + floor) - (d2 * 0.06571d)) - 6.622d) - d, 24.0d) - offset) + offset, 24.0d);
        int floor2 = (int) Math.floor(normalise3);
        int floor3 = (int) Math.floor((normalise3 - floor2) * 60.0d);
        Calendar calendar3 = Calendar.getInstance();
        calendar3.setTimeInMillis(calendar.getTimeInMillis());
        calendar3.set(11, floor2);
        calendar3.set(12, floor3);
        calendar3.set(13, 0);
        calendar3.set(14, 0);
        if (Intrinsics.areEqual(type, "MUHURTA")) {
            calendar3.add(12, -96);
        }
        return calendar3.getTimeInMillis();
    }
}
