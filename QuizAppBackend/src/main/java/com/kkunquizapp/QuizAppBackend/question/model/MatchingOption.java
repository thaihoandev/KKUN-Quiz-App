package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== MATCHING / PAIRING ====================
@Entity
@DiscriminatorValue("MATCHING")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingOption extends Option {
    // Left side item
    @Column(length = 500)
    private String leftItem;

    // Right side item to match
    @Column(length = 500)
    private String rightItem;

    // Match key for correct pairing
    @Column(length = 100)
    private String correctMatchKey; // e.g., "1-A", "left-1-right-A"

    // Support multiple matches
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String acceptedMatches; // JSON array of valid matches
}
