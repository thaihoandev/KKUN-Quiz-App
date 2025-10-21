package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Data
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "option_type")
@Table(name = "options")
public abstract class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID optionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, length = 1000)
    private String optionText;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean correct = false;
}
