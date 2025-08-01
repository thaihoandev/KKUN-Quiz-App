package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@DiscriminatorValue(QuestionType.TRUE_FALSE_TYPE)
@EqualsAndHashCode(callSuper = true)
public class TrueFalseOption extends Option {
    // Dùng chung structure với MultipleChoiceOption
}
