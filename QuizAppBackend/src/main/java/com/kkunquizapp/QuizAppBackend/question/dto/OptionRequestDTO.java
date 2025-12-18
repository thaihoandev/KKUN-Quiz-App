package com.kkunquizapp.QuizAppBackend.question.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class OptionRequestDTO {
    private UUID optionId;
    private String text;
    private String imageUrl;
    private boolean correct;
    private String matchKey;
    private int orderIndex;
    private String explanation;

    // FILL_IN_THE_BLANK specific
    private String correctAnswer;
    private boolean caseInsensitive;
    private String acceptedVariations; // comma-separated
    private int typoTolerance;

    // MATCHING specific
    private String leftItem;
    private String rightItem;
    private String correctMatchKey;

    // ORDERING specific
    private String item;
    private int correctPosition;

    // DRAG_DROP specific
    private String draggableItem;
    private String dropZoneId;
    private String dropZoneLabel;
    private String dragImageUrl;

    // SHORT_ANSWER specific
    private String expectedAnswer;
    private List<String> requiredKeywords;
    private List<String> optionalKeywords;
    private int partialCreditPercentage;

    // ESSAY specific
    private Map<String, Object> rubricCriteria;
    private int minWords;
    private int maxWords;
    private String sampleAnswer;
    private boolean enablePlagiarismCheck;

    // HOTSPOT specific
    private Map<String, Object> hotspotCoordinates; // {x, y, radius}
    private String hotspotLabel;

    // IMAGE_SELECTION specific
    private String imageLabel;
    private String thumbnailUrl;

    // DROPDOWN specific
    private String dropdownValue;
    private String displayLabel;
    private String placeholder;

    // MATRIX specific
    private String rowId;
    private String columnId;
    private String rowLabel;
    private String columnLabel;
    private String cellValue;
    private boolean isCorrectCell;

    // RANKING specific
    private String rankableItem;
    private int correctRank;
    private int rankingScale;
    private boolean allowPartialCredit;
}
