package com.kkunquizapp.QuizAppBackend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteUserRequestDTO {
    @NotBlank(message = "Password is required")
    private String password;
}
