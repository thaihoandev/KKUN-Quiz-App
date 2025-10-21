// src/main/java/com/kkunquizapp/QuizAppBackend/model/chat/Reaction.java
package com.kkunquizapp.QuizAppBackend.chat.model;

import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_reactions", indexes = {
        @Index(name = "idx_reactions_message", columnList = "message_id")
})
@Access(AccessType.FIELD) // ensure Hibernate maps only fields here
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ChatReaction {

    @EmbeddedId
    private ReactionId id;

    @MapsId("messageId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

//    @Column(name = "emoji", nullable = false, length = 20)
//    private String emoji;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Ensure there is NO other field/getter named created_at here.
    // If you had one for JSON, mark it @Transient or remove it.
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionId implements Serializable {
        @Column(name = "message_id", nullable = false)
        private UUID messageId;

        @Column(name = "user_id", nullable = false)
        private UUID userId;

        @Column(name = "emoji", nullable = false, length = 20)
        private String emoji; // trùng với cột emoji để làm composite PK
    }
}

