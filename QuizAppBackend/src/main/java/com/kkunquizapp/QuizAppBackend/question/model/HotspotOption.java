package com.kkunquizapp.QuizAppBackend.question.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// ==================== 10. HotspotOption ====================
@Entity
@Table(name = "hotspot_options")
@Data
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
public class HotspotOption extends Option {
    @Column(nullable = false, length = 500)
    private String imageUrl_hotspot;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String hotspotCoordinates;

    @Column(length = 200)
    private String hotspotLabel;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String validHotspots;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (this.hotspotLabel == null) this.hotspotLabel = "Hotspot";
    }
}
