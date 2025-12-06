package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 1. SingleChoiceOption ====================
@Entity
@Table(name = "single_choice_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class SingleChoiceOption extends Option {
    // Inherits common fields from Option
}
