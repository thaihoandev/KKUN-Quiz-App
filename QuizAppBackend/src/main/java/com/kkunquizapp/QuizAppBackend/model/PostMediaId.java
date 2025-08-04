package com.kkunquizapp.QuizAppBackend.model;

import lombok.Data;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class PostMediaId implements Serializable {
    private UUID post;
    private UUID media;

    // Default constructor
    public PostMediaId() {}

    // Constructor with fields
    public PostMediaId(UUID post, UUID media) {
        this.post = post;
        this.media = media;
    }

    // Getters and setters
    public UUID getPost() {
        return post;
    }

    public void setPost(UUID post) {
        this.post = post;
    }

    public UUID getMedia() {
        return media;
    }

    public void setMedia(UUID media) {
        this.media = media;
    }

    // Implement equals
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PostMediaId that = (PostMediaId) o;
        return Objects.equals(post, that.post) && Objects.equals(media, that.media);
    }

    // Implement hashCode
    @Override
    public int hashCode() {
        return Objects.hash(post, media);
    }
}