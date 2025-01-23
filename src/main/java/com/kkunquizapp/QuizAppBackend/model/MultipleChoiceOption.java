package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@DiscriminatorValue(QuestionType.MULTIPLE_CHOICE_TYPE)
public class MultipleChoiceOption extends Option {
    @Column(columnDefinition = "boolean default false")
    private boolean correct = false; // Dùng để xác định câu trả lời đúng
}
