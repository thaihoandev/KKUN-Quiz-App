package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Base Option class with JOINED inheritance
 * ✅ Better for having different fields per subclass
 * Each subclass gets its own table
 */
@Entity
@Table(name = "options", indexes = {
        @Index(columnList = "question_id, orderIndex"),
        @Index(columnList = "question_id")
})
@Data
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "option_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID optionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // ===== COMMON FIELDS =====
    @Column(nullable = false, length = 1000)
    private String text = "Option";

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private boolean correct = false;

    @Column(length = 200)
    private String matchKey;

    @Column(nullable = false)
    private int orderIndex = 0;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String extraData;

    // ===== LIFECYCLE CALLBACKS =====
    @PrePersist
    @PreUpdate
    private void ensureCommonDefaults() {
        if (this.text == null || this.text.isBlank()) {
            this.text = "Option";
        }
    }

    public String getText() {
        return (this.text != null && !this.text.isBlank()) ? this.text : "Option";
    }

    public void setText(String text) {
        this.text = (text != null && !text.isBlank()) ? text : "Option";
    }
}

// ==================== SUBCLASSES WITH JOINED INHERITANCE ====================

