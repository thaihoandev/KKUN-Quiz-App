package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@DiscriminatorValue(QuestionType.MULTIPLE_CHOICE_TYPE)
@EqualsAndHashCode(callSuper = true)
public class MultipleChoiceOption extends Option {
    // Không có gì thêm – dùng optionText và correct từ Option
}
