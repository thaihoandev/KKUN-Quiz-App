package com.kkunquizapp.QuizAppBackend.fileUpload.model;

import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA cần no-arg constructor, tối thiểu protected
@AllArgsConstructor
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

    @Column(name = "public_id")
    private String publicId; // Added for Cloudinary deletion

    @CreationTimestamp
    private LocalDateTime createdAt;
}
