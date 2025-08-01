package com.kkunquizapp.QuizAppBackend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
public class OptionResponseDTO {
    private UUID optionId;
    private String optionText;

    // Thêm các trường để phản ánh đầy đủ thông tin của từng loại option
    private Boolean correct; // Cho multiple choice
    private String correctAnswer; // Cho fill in the blank
}
