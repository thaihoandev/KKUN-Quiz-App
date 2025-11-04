package com.kkunquizapp.QuizAppBackend.common.utils;


import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class SlugUtil {
    public static String toSlug(String input, boolean addHashId) {
        if (input == null || input.isEmpty()) return "";

        // 1️⃣ Chuẩn hóa tiếng Việt
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = normalized
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("đ", "d")
                .replaceAll("Đ", "D");

        // 2️⃣ Tạo slug cơ bản
        String baseSlug = withoutDiacritics
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        if (!addHashId) return baseSlug;

        // 3️⃣ Tạo hash từ ngày giờ hiện tại
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String hashPart = shortHash(timestamp + input);

        return baseSlug + "-" + hashPart;
    }

    /**
     * Sinh chuỗi hash ngắn (8 ký tự) từ input
     */
    private static String shortHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 4; i++) { // chỉ lấy 4 byte đầu → 8 ký tự hex
                String h = Integer.toHexString(0xff & hash[i]);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

}
