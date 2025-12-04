package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ==================== DROPDOWN / SELECT ====================
@Entity
@DiscriminatorValue("DROPDOWN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DropdownOption extends Option {
    // Dropdown value
    @Column(length = 200)
    private String dropdownValue;

    // Display label
    @Column(length = 200)
    private String displayLabel;

    // Placeholder text
    @Column(length = 200)
    private String placeholder;
}
