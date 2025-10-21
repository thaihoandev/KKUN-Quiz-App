package com.kkunquizapp.QuizAppBackend.common.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtils {
    /**
     * Remove diacritical marks (accents) from a string.
     */
    public static String removeAccents(String input) {
        if (input == null) return null;
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        // Remove combining diacritical marks
        return normalized.replaceAll("\\p{M}", "");
    }

    /**
     * Truncate the input string to a maximum length, adding ellipsis if truncated.
     * @param input the original string
     * @param maxLength maximum number of characters to keep (excluding ellipsis)
     * @return truncated string with "..." if the input was longer than maxLength
     */
    public static String abbreviate(String input, int maxLength) {
        if (input == null) return null;
        if (maxLength < 0) throw new IllegalArgumentException("maxLength must be non-negative");
        // If input length is within limit, return as is
        if (input.length() <= maxLength) {
            return input;
        }
        // Otherwise truncate and append ellipsis
        String ellipsis = "...";
        // Ensure result length does not exceed maxLength + ellipsis
        int end = Math.max(0, maxLength - ellipsis.length());
        return input.substring(0, end) + ellipsis;
    }

    /**
     * Simple substring preview: take first n characters (or fewer) without ellipsis.
     * @param input the original string
     * @param length number of characters to take
     * @return the substring or the original if shorter
     */
    public static String preview(String input, int length) {
        if (input == null) return null;
        if (length < 0) throw new IllegalArgumentException("length must be non-negative");
        return input.length() <= length ? input : input.substring(0, length);
    }
}
