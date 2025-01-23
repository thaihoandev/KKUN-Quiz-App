package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@DiscriminatorValue(QuestionType.TRUE_FALSE_TYPE)
public class TrueFalseOption extends Option {
    @Column(columnDefinition = "boolean default false")
    private Boolean value = false;
}
