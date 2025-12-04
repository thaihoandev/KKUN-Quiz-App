package com.kkunquizapp.QuizAppBackend.game.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder(toBuilder = true)   // QUAN TRỌNG: thêm toBuilder = true
@NoArgsConstructor
@AllArgsConstructor
public class OptionDTO {

    private UUID optionId;
    private String text;
    private String imageUrl;
    private Integer orderIndex;
    private String matchKey;
    private String explanation;

    // === Dành cho các loại câu hỏi đặc biệt ===
    private String leftItem;           // Matching
    private String rightItem;          // Matching
    private String item;               // Ordering, Ranking
    private Integer correctPosition;   // Ordering (đã thêm)

    private String draggableItem;      // Drag & Drop
    private String dropZoneId;         // Drag & Drop
    private String dropZoneLabel;      // Drag & Drop
    private String dragImageUrl;       // Drag & Drop

    private String hotspotCoordinates; // Hotspot
    private String hotspotLabel;       // Hotspot

    private String imageLabel;         // Image Selection
    private String thumbnailUrl;       // Image Selection

    private String correctAnswer;      // Fill-in-the-blank, Short Answer
    private Boolean caseInsensitive;   // Fill-in-the-blank (đã thêm Boolean)

    // === Chỉ dùng khi reveal đáp án đúng (QUESTION_ENDED) ===
    private Boolean correct;           // true/false/null

    // === Extra data (nếu cần mở rộng sau này) ===
    private String extraData;
}