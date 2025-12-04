package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ==================== IMAGE SELECTION ====================
@Entity
@DiscriminatorValue("IMAGE_SELECTION")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageSelectionOption extends Option {
    // Image for selection
    @Column(nullable = false, length = 500)
    private String imageUrl;

    // Image label
    @Column(length = 200)
    private String imageLabel;

    // Thumbnail URL (smaller version)
    @Column(length = 500)
    private String thumbnailUrl;
}
