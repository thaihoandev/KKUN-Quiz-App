package com.kkunquizapp.QuizAppBackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "post_media")
@Data
@IdClass(PostMediaId.class)
public class PostMedia {
    @Id
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Id
    @ManyToOne
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Column(nullable = false)
    private int position = 0;

    private String caption;

    @Column(nullable = false)
    private boolean isCover = false;
}