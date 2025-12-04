package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("MATRIX")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class MatrixOption extends Option {
    @Column(length = 100)
    private String rowId;
    @Column(length = 100)
    private String columnId;
    @Column(length = 200)
    private String rowLabel;
    @Column(length = 200)
    private String columnLabel;
    @Column(length = 200)
    private String cellValue;

    @Column(nullable = false)
    private boolean isCorrectCell = false;
}
