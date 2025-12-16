package com.kkunquizapp.QuizAppBackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionResponseDTO {
    private UUID optionId;
    private String text;
    private String type;
    private String imageUrl;
    private Boolean correct; // Use Boolean (wrapper) to allow null when hiding answers
    private String matchKey;
    private int orderIndex;
    private String explanation;

    // FILL_IN_THE_BLANK
    private String correctAnswer;
    private String acceptedVariations;
    private int typoTolerance;

    // MATCHING
    private String leftItem;
    private String rightItem;
    private String correctMatchKey;

    // ORDERING
    private String item;
    private int correctPosition;

    // DRAG_DROP
    private String draggableItem;
    private String dropZoneId;
    private String dropZoneLabel;
    private String dragImageUrl;

    // SHORT_ANSWER
    private String expectedAnswer;
    private List<String> requiredKeywords;
    private List<String> optionalKeywords;
    private int partialCreditPercentage;

    // ESSAY
    private Map<String, Object> rubricCriteria;
    private int minWords;
    private int maxWords;
    private String sampleAnswer;
    private boolean enablePlagiarismCheck;

    // HOTSPOT
    private Map<String, Object> hotspotCoordinates;
    private String hotspotLabel;

    // IMAGE_SELECTION
    private String imageLabel;
    private String thumbnailUrl;

    // DROPDOWN
    private String dropdownValue;
    private String displayLabel;
    private String placeholder;

    // MATRIX
    private String rowId;
    private String columnId;
    private String rowLabel;
    private String columnLabel;
    private String cellValue;
    private boolean isCorrectCell;

    // RANKING
    private String rankableItem;
    private int correctRank;
    private int rankingScale;
    private boolean allowPartialCredit;
}
