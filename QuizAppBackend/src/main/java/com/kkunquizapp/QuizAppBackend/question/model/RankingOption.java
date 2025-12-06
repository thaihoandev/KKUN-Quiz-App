package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 14. RankingOption ====================
@Entity
@Table(name = "ranking_options")
@Data
@NoArgsConstructor
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

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.rankableItem == null) this.rankableItem = this.getText();
        if (this.correctRank < 0) this.correctRank = 0;
        if (this.rankingScale < 1) this.rankingScale = 5;
    }
}
