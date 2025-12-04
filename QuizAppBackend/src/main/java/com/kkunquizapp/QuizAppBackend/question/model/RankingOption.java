package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== RANKING ====================
@Entity
@DiscriminatorValue("RANKING")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class RankingOption extends Option {
    @Column(length = 500)
    private String rankableItem;

    @Column(nullable = false)
    private int correctRank = 0;

    @Column(nullable = false)
    private int rankingScale = 5;

    @Column(nullable = false)
    private boolean allowPartialCredit = false;
}
