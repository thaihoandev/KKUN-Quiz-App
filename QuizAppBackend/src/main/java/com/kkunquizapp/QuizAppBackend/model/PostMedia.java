package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.Media;
import com.kkunquizapp.QuizAppBackend.model.Post;
import com.kkunquizapp.QuizAppBackend.model.PostMediaId;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "post_media")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA cần no-arg constructor, tối thiểu protected
@AllArgsConstructor
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
