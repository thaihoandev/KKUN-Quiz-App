package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== SINGLE CHOICE OPTION ====================
@Entity
@DiscriminatorValue("SINGLE_CHOICE")
@Data
@SuperBuilder              // QUAN TRỌNG: dùng @SuperBuilder thay vì @Builder
@AllArgsConstructor
public class SingleChoiceOption extends Option {
    // Inherits all from Option
    // Only one correct answer
}
