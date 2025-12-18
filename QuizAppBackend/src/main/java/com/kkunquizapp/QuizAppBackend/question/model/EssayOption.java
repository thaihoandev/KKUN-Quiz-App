package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 9. EssayOption ====================
@Entity
@Table(name = "essay_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class EssayOption extends Option {
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String rubricCriteria;

    @Column(nullable = false)
    private int minWords = 0;

    @Column(nullable = false)
    private int maxWords = 0;

    @Column(nullable = false)
    private boolean requiresManualGrading = true;

    @Column(columnDefinition = "TEXT")
    private String sampleAnswer;

    @Column(nullable = false)
    private boolean enablePlagiarismCheck = false;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.minWords < 0) this.minWords = 0;
        if (this.maxWords < 0) this.maxWords = 0;
    }
}
