package com.kkunquizapp.QuizAppBackend.user.model.enums;

public enum FriendshipStatus {
    NONE,        // chưa có gì
    REQUESTED,   // mình đã gửi lời mời cho họ (pending)
    INCOMING,    // họ đã gửi lời mời cho mình (pending)
    FRIEND       // đã là bạn
}
