package com.kkunquizapp.QuizAppBackend.common.utils;


public class SlugUtil {
    public static String toSlug(String title) {
        if (title == null) return "";
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
