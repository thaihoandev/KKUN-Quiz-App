package com.kkunquizapp.QuizAppBackend.common.helper;

public class validateHelper {
    public static boolean isEmailFormat(String value) {
        String emailRegex = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$";
        return value.matches(emailRegex);
    }
}
