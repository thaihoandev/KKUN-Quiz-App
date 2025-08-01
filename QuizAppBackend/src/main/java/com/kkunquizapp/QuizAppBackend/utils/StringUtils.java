package com.kkunquizapp.QuizAppBackend.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtils {
    public static String removeAccents(String input) {
        if (input == null) return null;
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }
}
