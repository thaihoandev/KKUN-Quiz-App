package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "options", indexes = {
        @Index(columnList = "question_id, orderIndex"),
        @Index(columnList = "question_id")
})
@Data
@SuperBuilder(toBuilder = true)  // QUAN TRỌNG: dùng @SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "option_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID optionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, length = 1000)
    private String text;

    private String imageUrl;

    @Column(nullable = false)
    private boolean correct = false;

    private String matchKey;

    @Column(nullable = false)
    private int orderIndex = 0;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String extraData;
}