package com.patron.erp.util;

public final class MonetaryUtil {

    private MonetaryUtil() {}

    public static long toCents(Double value) {
        if (value == null) return 0L;
        return Math.round(value * 100);
    }

    public static double toAmount(Long cents) {
        if (cents == null) return 0.0;
        return cents / 100.0;
    }
}
