package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 13. MatrixOption ====================
@Entity
@Table(name = "matrix_options")
@Data
@NoArgsConstructor
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

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.cellValue == null) this.cellValue = this.getText();
    }
}
