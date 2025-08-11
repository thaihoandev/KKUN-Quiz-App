// EmailChangeOtpPayload.java
package com.kkunquizapp.QuizAppBackend.model;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailChangeOtpPayload {
    private String newEmail;
    private String codeHash;
    private int attempts;
}
