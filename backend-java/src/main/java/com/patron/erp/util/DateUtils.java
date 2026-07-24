package com.patron.erp.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class DateUtils {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter HN = DateTimeFormatter.ofPattern("d/M/yyyy");
    private static final DateTimeFormatter HN_PAD = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr, ISO);
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(dateStr, HN);
            } catch (DateTimeParseException e2) {
                return LocalDate.parse(dateStr, HN_PAD);
            }
        }
    }

    public static LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            LocalDate d = parseDate(dateStr);
            return d != null ? d.atStartOfDay() : null;
        }
    }
}
