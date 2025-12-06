package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 6. OrderingOption ====================
@Entity
@Table(name = "ordering_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class OrderingOption extends Option {
    @Column(length = 500)
    private String item;

    @Column(nullable = false)
    private int correctPosition = 0;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String acceptedPositions;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.item == null) this.item = this.getText();
        if (this.correctPosition < 0) this.correctPosition = 0;
    }
}
