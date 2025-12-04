package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("MULTIPLE_CHOICE")
@Data
@SuperBuilder              // QUAN TRỌNG: dùng @SuperBuilder thay vì @Builder
@AllArgsConstructor        // vẫn giữ
public class MultipleChoiceOption extends Option {
    // Không cần thêm gì cả
    // Tất cả field thừa kế từ Option
}