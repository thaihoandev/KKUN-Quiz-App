package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 3. TrueFalseOption ====================
@Entity
@Table(name = "true_false_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class TrueFalseOption extends Option {
    // Inherits common fields from Option
}
