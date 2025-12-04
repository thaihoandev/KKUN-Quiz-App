package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== TRUE/FALSE OPTION ====================
@Entity
@DiscriminatorValue("TRUE_FALSE")
@Data
@SuperBuilder              // QUAN TRỌNG: dùng @SuperBuilder thay vì @Builder
@AllArgsConstructor
public class TrueFalseOption extends Option {
    // Inherits all from Option
    // Exactly 2 options: True & False
}
