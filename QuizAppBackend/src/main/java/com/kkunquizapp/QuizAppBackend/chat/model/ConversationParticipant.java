package com.kkunquizapp.QuizAppBackend.chat.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kkunquizapp.QuizAppBackend.chat.model.enums.ParticipantRole;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "conversation_participants", indexes = {
        @Index(name = "idx_participants_conv", columnList = "conversation_id"),
        @Index(name = "idx_participants_user", columnList = "user_id")
})
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class ConversationParticipant {

    @EmbeddedId
    @ToString.Include
    private ConversationParticipantId id;

    @MapsId("conversationId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    @JsonBackReference(value = "conv-participants")
    @ToString.Exclude
    private Conversation conversation;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // tránh serialize cả User tree (đã có DTO cho user)
    @ToString.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @ToString.Include
    private ParticipantRole role = ParticipantRole.MEMBER;

    @Column(length = 100)
    private String nickname;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    // ===== EmbeddedId =====
    @Embeddable
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ConversationParticipantId implements Serializable {
        @Column(name = "conversation_id", nullable = false)
        private UUID conversationId;

        @Column(name = "user_id", nullable = false)
        private UUID userId;
    }

    // equals/hashCode dựa trên embedded id
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ConversationParticipant other)) return false;
        return id != null && id.equals(other.id);
    }
    @Override
    public int hashCode() { return 31; }
}
