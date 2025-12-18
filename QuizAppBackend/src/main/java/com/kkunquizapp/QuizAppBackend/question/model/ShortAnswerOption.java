package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 8. ShortAnswerOption ====================
@Entity
@Table(name = "short_answer_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class ShortAnswerOption extends Option {
    @Column(length = 1000)
    private String expectedAnswer;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String requiredKeywords;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String optionalKeywords;

    @Column(nullable = false)
    private boolean caseInsensitive = false;

    @Column(nullable = false)
    private int partialCreditPercentage = 50;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.partialCreditPercentage < 0 || this.partialCreditPercentage > 100) {
            this.partialCreditPercentage = 50;
        }
        if (this.expectedAnswer == null) this.expectedAnswer = this.getText();
    }
}
