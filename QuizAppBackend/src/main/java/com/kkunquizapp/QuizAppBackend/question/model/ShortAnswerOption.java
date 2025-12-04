package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== SHORT ANSWER ====================
@Entity
@DiscriminatorValue("SHORT_ANSWER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class ShortAnswerOption extends Option {
    @Column(length = 1000)
    private String expectedAnswer;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String requiredKeywords;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String optionalKeywords;

    @Column(nullable = false)
    private boolean caseInsensitive = false;

    @Column(nullable = false)
    private int partialCreditPercentage = 50;
}
