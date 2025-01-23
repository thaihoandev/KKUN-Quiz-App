package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@DiscriminatorValue(QuestionType.TRUE_FALSE_TYPE)
@EqualsAndHashCode(callSuper = true)
public class TrueFalseOption extends Option {
    @Column(columnDefinition = "boolean default false")
    private Boolean value = false;
}
