// ==================== OptionDTO.java ====================
package com.kkunquizapp.QuizAppBackend.game.dto;

import lombok.*;

import java.util.UUID;

/**
 * ✅ FIXED: Added 'type' field for type discrimination
 */
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class OptionDTO {

    // === CORE FIELDS ===
    private UUID optionId;
    private String type;                    // ✅ ADDED: Question type (SINGLE_CHOICE, MULTIPLE_CHOICE, etc)
    private Integer orderIndex;
    private String explanation;

    // === SINGLE_CHOICE / MULTIPLE_CHOICE / TRUE_FALSE / IMAGE_SELECTION ===
    private String text;
    private String imageUrl;
    private String imageLabel;
    private String thumbnailUrl;

    // === FILL_IN_THE_BLANK ===
    private String correctAnswer;
    private Boolean caseInsensitive;

    // === MATCHING ===
    private String leftItem;
    private String rightItem;

    // === ORDERING ===
    private String item;
    private Integer correctPosition;

    // === RANKING ===
    private String rankableItem;
    private Integer correctRank;
    private Integer rankingScale;

    // === DRAG_DROP ===
    private String draggableItem;
    private String dropZoneId;
    private String dropZoneLabel;
    private String dragImageUrl;

    // === HOTSPOT ===
    private String hotspotCoordinates;
    private String hotspotLabel;

    // === SHORT_ANSWER ===
    private String expectedAnswer;

    // === ESSAY ===
    private Integer minWords;
    private Integer maxWords;
    private String sampleAnswer;

    // === DROPDOWN ===
    private String dropdownValue;
    private String displayLabel;
    private String placeholder;

    // === MATRIX ===
    private String rowId;
    private String columnId;
    private String rowLabel;
    private String columnLabel;
    private String cellValue;

    // === REVEAL ANSWER (chỉ sau khi QUESTION_ENDED) ===
    private Boolean correct;

    // === EXTRA ===
    private String extraData;
    private String matchKey;  // Keep for backward compatibility
}