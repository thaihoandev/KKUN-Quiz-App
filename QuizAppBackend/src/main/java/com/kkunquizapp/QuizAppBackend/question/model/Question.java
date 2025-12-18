package com.kkunquizapp.QuizAppBackend.question.model;

import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_questions_quiz_order", columnList = "quiz_id, orderIndex"),
        @Index(name = "idx_questions_deleted", columnList = "deleted"),
        @Index(name = "idx_questions_difficulty", columnList = "difficulty"),
        @Index(name = "idx_questions_created_by", columnList = "created_by")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false, length = 2000)
    private String questionText;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private QuestionType type;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String configJson;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 1000)
    private String hint;

    @Column(nullable = false)
    @Builder.Default
    private int timeLimitSeconds = 20;

    @Column(nullable = false)
    @Builder.Default
    private int points = 100;

    @Column(nullable = false)
    @Builder.Default
    private int orderIndex = 0;

    // Soft delete
    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    private LocalDateTime deletedAt;
    private UUID deletedBy;

    // Audit
    private UUID createdBy;
    private UUID updatedBy;

    @Column(length = 20)
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String tagsJson = "[]";

    @Column(nullable = false)
    @Builder.Default
    private boolean isFavorite = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean shuffleOptions = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean caseInsensitive = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean partialCredit = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean allowMultipleCorrect = false;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String answerVariationsJson = "[]";

    @Column(nullable = false)
    @Builder.Default
    private int version = 1;

    // Analytics
    @Column(nullable = false)
    @Builder.Default
    private int totalAttempts = 0;

    @Column(nullable = false)
    @Builder.Default
    private int correctAttempts = 0;

    @Column(nullable = false)
    @Builder.Default
    private double passRate = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private int averageTimeSeconds = 0;

    @Column(nullable = false)
    @Builder.Default
    private double difficultyIndex = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double discriminationIndex = 0.0;

    // Rich content flags
    @Column(nullable = false)
    @Builder.Default
    private boolean hasLatex = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasCode = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasTable = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasVideo = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasAudio = false;

    // ==================== QUAN TRỌNG ====================
    // Phải có @Builder.Default để options không bao giờ null
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Option> options = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ==================== HELPER METHODS ====================

    /**
     * Ensure options is never null (safety check)
     */
    @PrePersist
    @PreUpdate
    private void ensureCollectionsNotNull() {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
    }

    /**
     * Get options safely - never returns null
     */
    public List<Option> getOptions() {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        return this.options;
    }

    /**
     * Set options safely
     */
    public void setOptions(List<Option> options) {
        this.options = (options != null) ? options : new ArrayList<>();
    }

    /**
     * Add option safely
     */
    public void addOption(Option option) {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        this.options.add(option);
    }

    /**
     * Remove option safely
     */
    public void removeOption(Option option) {
        if (this.options != null) {
            this.options.remove(option);
        }
    }

    /**
     * Check if has options
     */
    public boolean hasOptions() {
        return this.options != null && !this.options.isEmpty();
    }

    /**
     * Get option count
     */
    public int getOptionCount() {
        return (this.options != null) ? this.options.size() : 0;
    }
}