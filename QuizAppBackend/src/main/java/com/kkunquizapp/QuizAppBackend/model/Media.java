package com.kkunquizapp.QuizAppBackend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media")
@Data
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID mediaId;

    @ManyToOne
    @JoinColumn(name = "owner_user_id")
    private User ownerUser;

    @Column(nullable = false)
    private String url;

    private String thumbnailUrl;

    private String mimeType;

    private Integer width;

    private Integer height;

    private Long sizeBytes;

    private String contentHash;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
