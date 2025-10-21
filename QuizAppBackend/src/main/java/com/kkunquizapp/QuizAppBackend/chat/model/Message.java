package com.kkunquizapp.QuizAppBackend.chat.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_messages_conv_created", columnList = "conversation_id, created_at DESC"),
        @Index(name = "idx_messages_sender", columnList = "sender_id")
})
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ToString.Include
    private UUID id;

    @Column(name = "client_id", length = 64)
    @ToString.Include
    private String clientId; // id phía client (optimistic UI)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    @JsonBackReference(value = "conv-messages")
    @ToString.Exclude
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnore           // trả DTO sender thay vì toàn bộ User
    @ToString.Exclude
    private User sender;

    @Column(columnDefinition = "TEXT")
    @ToString.Include
    private String content;

    // Tránh vòng lặp khi serialize reply chain → dùng JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to")
    @JsonIgnore
    @ToString.Exclude
    private Message replyTo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    @ToString.Include
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    @JsonIgnore          // map sang DTO nếu cần
    @ToString.Exclude
    private Set<ChatAttachment> attachments = new LinkedHashSet<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    @ToString.Exclude
    private Set<MessageStatus> statuses = new LinkedHashSet<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    @ToString.Exclude
    private Set<ChatReaction> chatReactions = new LinkedHashSet<>();

    // equals/hashCode theo id
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Message other)) return false;
        return id != null && id.equals(other.id);
    }
    @Override
    public int hashCode() { return 31; }
}
