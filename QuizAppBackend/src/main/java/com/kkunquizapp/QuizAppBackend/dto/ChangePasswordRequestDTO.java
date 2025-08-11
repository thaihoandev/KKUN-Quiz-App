package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

@Data
public class ChangePasswordRequestDTO {
    private String currentPassword;
    private String newPassword;
}
