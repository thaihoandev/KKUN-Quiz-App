package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 2. MultipleChoiceOption ====================
@Entity
@Table(name = "multiple_choice_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class MultipleChoiceOption extends Option {
    // Inherits common fields from Option
}
