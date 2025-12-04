package com.kkunquizapp.QuizAppBackend.quiz.model.enums;

public enum Visibility {
    PUBLIC,          // ai cũng chơi được
    UNLISTED,        // chỉ người có link
    PASSWORD,        // cần nhập mật khẩu
    PRIVATE          // chỉ người được mời (danh sách userId)
}