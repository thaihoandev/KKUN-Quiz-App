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
@Entity
@DiscriminatorValue("ESSAY")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class EssayOption extends Option {
    @Column(columnDefinition = "JSONB")
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
}
