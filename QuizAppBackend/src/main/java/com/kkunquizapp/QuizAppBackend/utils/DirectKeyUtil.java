// src/main/java/com/kkunquizapp/QuizAppBackend/util/DirectKeyUtil.java
package com.kkunquizapp.QuizAppBackend.utils;

import java.util.Objects;
import java.util.UUID;

public final class DirectKeyUtil {
    private DirectKeyUtil() {}

    /** Trả về "min(a,b):max(a,b)" theo thứ tự UUID.compareTo */
    public static String of(UUID a, UUID b) {
        Objects.requireNonNull(a, "userA");
        Objects.requireNonNull(b, "userB");
        int cmp = a.compareTo(b);
        UUID left  = (cmp <= 0) ? a : b;
        UUID right = (cmp <= 0) ? b : a;
        return left.toString() + ":" + right.toString(); // UUID.toString() luôn lowercase
    }

    /** Parse từ chuỗi "uuid:uuid" (tuỳ chọn, nếu cần) */
    public static String of(String a, String b) {
        return of(UUID.fromString(a), UUID.fromString(b));
    }
}
