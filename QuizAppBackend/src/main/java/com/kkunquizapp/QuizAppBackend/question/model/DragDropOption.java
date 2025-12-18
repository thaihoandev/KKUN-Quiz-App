package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 7. DragDropOption ====================
@Entity
@Table(name = "drag_drop_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class DragDropOption extends Option {
    @Column(length = 500)
    private String draggableItem;

    @Column(length = 100)
    private String dropZoneId;

    @Column(length = 200)
    private String dropZoneLabel;

    @Column(length = 500)
    private String dragImageUrl;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String correctDropZones;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.draggableItem == null) this.draggableItem = this.getText();
        if (this.dropZoneId == null) this.dropZoneId = "zone-1";
    }
}
