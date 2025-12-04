package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== DRAG AND DROP ====================
@Entity
@DiscriminatorValue("DRAG_DROP")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DragDropOption extends Option {
    // Draggable item
    @Column(length = 500)
    private String draggableItem;

    // Drop zone identifier
    @Column(length = 100)
    private String dropZoneId; // e.g., "zone-1", "category-A"

    // Drop zone label
    @Column(length = 200)
    private String dropZoneLabel;

    // Image for drag-drop (optional)
    @Column(length = 500)
    private String dragImageUrl;

    // Correct drop zone(s)
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String correctDropZones; // JSON array of valid zones
}
