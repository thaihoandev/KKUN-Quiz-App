package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("FILL_IN_THE_BLANK")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
