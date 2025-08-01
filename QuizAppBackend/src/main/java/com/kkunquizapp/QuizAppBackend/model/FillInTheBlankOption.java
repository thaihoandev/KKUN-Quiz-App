package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@DiscriminatorValue(QuestionType.FILL_IN_THE_BLANK_TYPE)
@EqualsAndHashCode(callSuper = true)
public class FillInTheBlankOption extends Option {

    @Column(length = 1000, nullable = false)
    private String correctAnswer;

    // Gợi ý: Fill in the blank luôn là đáp án đúng, không cần boolean correct
    @PrePersist
    @PreUpdate
    public void markAsCorrect() {
        setCorrect(true);
    }
}
