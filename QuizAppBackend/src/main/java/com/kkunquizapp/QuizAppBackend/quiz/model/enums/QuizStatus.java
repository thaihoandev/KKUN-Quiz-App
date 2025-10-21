package com.kkunquizapp.QuizAppBackend.quiz.model.enums;

public enum QuizStatus {
    DRAFT,      // Bản nháp, chưa sẵn sàng để xuất bản
    PUBLISHED,  // Đã xuất bản, có thể được chơi bởi người dùng
    CLOSED,      // Đã đóng, không còn khả dụng để chơi
    ARCHIVED // LUU TRU quiz
}

