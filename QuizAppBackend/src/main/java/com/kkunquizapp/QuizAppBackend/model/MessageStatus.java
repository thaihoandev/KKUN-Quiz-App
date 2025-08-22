// src/main/java/com/kkunquizapp/QuizAppBackend/model/chat/MessageStatus.java
package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "message_status", indexes = {
        @Index(name = "idx_msg_status_user_read", columnList = "user_id, read_at"),
        @Index(name = "idx_msg_status_message", columnList = "message_id")
})
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class MessageStatus {

    @EmbeddedId
    private MessageStatusId id;

    @MapsId("messageId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageStatusId implements Serializable {
        @Column(name = "message_id", nullable = false)
        private UUID messageId;

        @Column(name = "user_id", nullable = false)
        private UUID userId;
    }
}
