package com.kkunquizapp.QuizAppBackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.kkunquizapp.QuizAppBackend.model.enums.ConversationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "conversations", indexes = {
        @Index(name = "idx_conversations_type", columnList = "type"),
        @Index(name = "idx_conversations_created_at", columnList = "created_at")
})
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ToString.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @ToString.Include
    private ConversationType type; // DIRECT | GROUP

    @Column(length = 255)
    @ToString.Include
    private String title; // dùng cho GROUP

    @Column(name = "direct_key", length = 255)
    private String directKey; // unique logic ở DB (partial index)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnore
    @ToString.Exclude
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    @ToString.Include
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonManagedReference(value = "conv-participants")
    @ToString.Exclude
    private Set<ConversationParticipant> participants = new LinkedHashSet<>();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonManagedReference(value = "conv-messages")
    @ToString.Exclude
    private Set<Message> messages = new LinkedHashSet<>();

    // equals/hashCode chỉ theo id để tránh duyệt quan hệ
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Conversation other)) return false;
        return id != null && id.equals(other.id);
    }
    @Override
    public int hashCode() { return 31; }
}
