package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// ==================== 12. DropdownOption ====================
@Entity
@Table(name = "dropdown_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class DropdownOption extends Option {
    @Column(length = 200)
    private String dropdownValue;

    @Column(length = 200)
    private String displayLabel;

    @Column(length = 200)
    private String placeholder;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.dropdownValue == null) this.dropdownValue = "value";
        if (this.displayLabel == null) this.displayLabel = this.getText();
    }
}
