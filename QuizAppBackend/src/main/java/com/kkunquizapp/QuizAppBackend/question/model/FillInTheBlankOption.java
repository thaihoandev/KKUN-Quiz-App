package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 4. FillInTheBlankOption ====================
@Entity
@Table(name = "fill_in_blank_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class FillInTheBlankOption extends Option {
    @Column(columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(nullable = false)
    private boolean caseInsensitive = false;

    @Column(columnDefinition = "TEXT")
    private String acceptedVariations;

    @Column(nullable = false)
    private int typoTolerance = 0;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.typoTolerance < 0) this.typoTolerance = 0;
        if (this.correctAnswer == null) this.correctAnswer = this.getText();
    }
}
