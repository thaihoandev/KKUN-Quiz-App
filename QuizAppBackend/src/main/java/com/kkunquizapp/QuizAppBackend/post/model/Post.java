package com.kkunquizapp.QuizAppBackend.post.model;

import com.kkunquizapp.QuizAppBackend.post.model.enums.PostPrivacy;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA cần no-arg constructor
@AllArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID postId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostPrivacy privacy = PostPrivacy.PUBLIC;

    @ManyToOne
    @JoinColumn(name = "reply_to_post_id")
    private Post replyToPost;

    private long likeCount = 0;

    private long commentCount = 0;

    private long shareCount = 0;

    @Column(nullable = false)
    private boolean locked = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}