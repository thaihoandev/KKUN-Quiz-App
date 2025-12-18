package com.kkunquizapp.QuizAppBackend.game.model.enums;

// Nên tạo riêng package dto.enums hoặc dùng chung với model nếu được
public enum GameStatus {
    WAITING, STARTING, IN_PROGRESS, PAUSED, FINISHED, CANCELLED, EXPIRED
}
