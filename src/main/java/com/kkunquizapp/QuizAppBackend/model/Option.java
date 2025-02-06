package com.kkunquizapp.QuizAppBackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Data
@Inheritance(strategy = InheritanceType.SINGLE_TABLE) // Bạn có thể đổi thành JOINED hoặc TABLE_PER_CLASS
@DiscriminatorColumn(name = "option_type", discriminatorType = DiscriminatorType.STRING)
@Table(name = "options")
public abstract class Option {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID optionId;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, length = 1000)
    private String optionText;


}
