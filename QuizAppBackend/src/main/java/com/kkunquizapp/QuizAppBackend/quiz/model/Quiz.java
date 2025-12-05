package com.kkunquizapp.QuizAppBackend.quiz.model;

import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Difficulty;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.Visibility;
import com.kkunquizapp.QuizAppBackend.user.model.User;
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
@Table(name = "quizzes", indexes = {
        @Index(name = "idx_quizzes_deleted", columnList = "deleted"),
        @Index(name = "idx_quizzes_creator_published", columnList = "creator_id, published"),
        @Index(name = "idx_quizzes_visibility", columnList = "visibility"),
        @Index(name = "idx_quizzes_created_at", columnList = "created_at DESC"),
        @Index(name = "idx_quizzes_slug", columnList = "slug"),
        @Index(name = "idx_quizzes_created_by", columnList = "created_by")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID quizId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 200, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    private String coverImageUrl;

    @OneToMany(
            mappedBy = "quiz",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("orderIndex ASC")
    private List<Question> questions = new ArrayList<>();

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String tagsJson = "[]";

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty = Difficulty.MEDIUM;

    private Integer estimatedMinutes;

    @Column(nullable = false)
    private boolean published = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility = Visibility.PUBLIC;

    private String accessPassword;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String allowedUserIdsJson = "[]";

    // Soft delete
    @Column(nullable = false)
    private boolean deleted = false;

    private LocalDateTime deletedAt;
    private UUID deletedBy;

    // Audit
    private UUID createdBy;
    private UUID updatedBy;

    // Analytics (denormalized)
    @Column(nullable = false)
    private int totalQuestions = 0;

    @Column(nullable = false)
    private int totalSessions = 0;

    @Column(nullable = false)
    private int totalLivePlays = 0;

    @Column(nullable = false)
    private double averageScore = 0.0;

    @Column(nullable = false)
    private int averageTimeSpent = 0;

    @Column(nullable = false)
    private int viewCount = 0;

    @Column(nullable = false)
    private int startCount = 0;

    @Column(nullable = false)
    private int completionCount = 0;

    // Timestamps
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Integer categoryId;
}