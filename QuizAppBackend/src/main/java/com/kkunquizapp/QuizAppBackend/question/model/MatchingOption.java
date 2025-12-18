package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 5. MatchingOption ====================
@Entity
@Table(name = "matching_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class MatchingOption extends Option {
    @Column(length = 500)
    private String leftItem;

    @Column(length = 500)
    private String rightItem;

    @Column(length = 100)
    private String correctMatchKey;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String acceptedMatches;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.leftItem == null) this.leftItem = this.getText();
        if (this.correctMatchKey == null) this.correctMatchKey = "match";
    }
}
