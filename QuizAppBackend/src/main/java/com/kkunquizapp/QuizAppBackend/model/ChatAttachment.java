// src/main/java/com/kkunquizapp/QuizAppBackend/model/chat/ChatAttachment.java
package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.Media;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "chat_attachments",
        uniqueConstraints = @UniqueConstraint(name = "uk_msg_media_once", columnNames = {"message_id", "media_id"}),
        indexes = {
                @Index(name = "idx_chat_att_message", columnList = "message_id"),
                @Index(name = "idx_chat_att_media", columnList = "media_id")
        })
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ChatAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Column(length = 500)
    private String caption;

    @Column(name = "display_order")
    private Integer displayOrder;
}
