package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 11. ImageSelectionOption ====================
@Entity
@Table(name = "image_selection_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class ImageSelectionOption extends Option {
    @Column(nullable = false, length = 500)
    private String imageUrl;

    @Column(length = 200)
    private String imageLabel;

    @Column(length = 500)
    private String thumbnailUrl;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.imageLabel == null) this.imageLabel = "Image";
    }
}
