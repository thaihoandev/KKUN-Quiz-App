package com.kkunquizapp.QuizAppBackend.game.dto;

import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 *
 * Based on actual Question model fields:
 * - tagsJson and answerVariationsJson need to be parsed/converted
 * - Only fields that exist on Question are mapped
 * - questionType is QuestionType enum (NOT String)
 * - options is List<OptionDTO> (NOT List<OptionResponseDTO>)
 *
 * Used by GameMapper for:
 * - toQuestionDTOWithoutAnswers() → Send to players (no correct flag)
 * - toQuestionDTO() → Show results (with correct flag)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponseDTO {

    // ==================== CORE FIELDS ====================
    private UUID questionId;
    private UUID quizId;
    private String questionText;
    private QuestionType type;  // ✅ ENUM from question.getType()
    private String imageUrl;
    private int timeLimitSeconds;
    private int points;
    private int orderIndex;
    private String explanation;
    private String hint;
    private String difficulty;

    // ==================== QUESTION SETTINGS ====================
    private boolean shuffleOptions;
    private boolean caseInsensitive;
    private boolean partialCredit;
    private boolean allowMultipleCorrect;
    private List<String> tags;  // ✅ Parsed from question.tagsJson
    private List<String> answerVariations;  // ✅ Parsed from question.answerVariationsJson

    // ==================== SOFT DELETE INFO ====================
    private boolean deleted;
    private LocalDateTime deletedAt;
    private UUID deletedBy;

    // ==================== AUDIT INFO ====================
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int version;

    // ==================== ANALYTICS ====================
    private int totalAttempts;
    private int correctAttempts;
    private double passRate;
    private int averageTimeSeconds;
    private double difficultyIndex;
    private double discriminationIndex;

    // ==================== RICH CONTENT FLAGS ====================
    private boolean hasLatex;
    private boolean hasCode;
    private boolean hasTable;
    private boolean hasVideo;
    private boolean hasAudio;

    // ==================== OPTIONS ====================
    private List<OptionDTO> options;  // ✅ Use OptionDTO
}