package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== HOTSPOT / IMAGE INTERACTIVE ====================
@Entity
@DiscriminatorValue("HOTSPOT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotspotOption extends Option {
    // Image URL for interactive hotspot
    @Column(nullable = false, length = 500)
    private String imageUrl;

    // Hotspot coordinates (JSON)
    // Format: {"x": 100, "y": 200, "radius": 50}
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String hotspotCoordinates;

    // Label for hotspot (optional)
    @Column(length = 200)
    private String hotspotLabel;

    // All valid hotspots (in case multiple correct)
    @Column(columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String validHotspots; // JSON array of valid coordinates
}
