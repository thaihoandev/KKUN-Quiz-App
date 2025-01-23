package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@DiscriminatorValue(QuestionType.FILL_IN_THE_BLANK_TYPE)
public class FillInTheBlankOption extends Option {
    @Column(columnDefinition = "varchar(1000)")
    private String correctAnswer;


}
