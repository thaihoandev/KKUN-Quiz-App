package com.kkunquizapp.QuizAppBackend.game.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.game.model.*;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.model.Option;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ FINAL FIXED GameMapper
 *
 * KEY FIXES:
 * 1. Import game.dto.QuestionResponseDTO (not question.dto)
 * 2. Import game.dto.OptionDTO (not question.dto.OptionResponseDTO)
 * 3. Map questionType as QuestionType enum
 * 4. Parse tagsJson and answerVariationsJson from JSON
 * 5. toQuestionDTOWithoutAnswers() → No correct flag
 * 6. toQuestionDTO() → Include correct flag
 * 7. Clean mapping with only relevant fields per option type
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GameMapper {

    // ==================== Game → DTO ====================

    @Mapping(target = "quizTitle", source = "quiz.title")
    @Mapping(target = "quizThumbnail", source = "quiz.coverImageUrl")
    @Mapping(target = "hostNickname", source = "host.name")
    @Mapping(target = "status", source = "gameStatus")
    GameResponseDTO toResponseDTO(Game game);

    @Mapping(target = "quiz", source = "game")
    @Mapping(target = "host", source = "game.host")
    @Mapping(target = "currentParticipant", source = "participant")
    @Mapping(target = "isHost", source = "isHost")
    @Mapping(target = "gameStatus", source = "game.gameStatus")
    GameDetailDTO toDetailDTO(Game game, boolean isHost, GameParticipant participant);

    @Mapping(target = "quizId", source = "quiz.quizId")
    @Mapping(target = "title", source = "quiz.title")
    @Mapping(target = "description", source = "quiz.description")
    @Mapping(target = "thumbnailUrl", source = "quiz.coverImageUrl")
    @Mapping(target = "questionCount", source = "totalQuestions")
    QuizInfoDTO toQuizInfoDTO(Game game);

    // ==================== Host & Participant Info ====================

    default HostInfoDTO toHostInfoDTO(User host) {
        if (host == null) return null;
        return HostInfoDTO.builder()
                .userId(host.getUserId())
                .username(host.getUsername())
                .nickname(host.getName())
                .avatarUrl(host.getAvatar())
                .build();
    }

    default ParticipantInfoDTO toParticipantInfoDTO(GameParticipant participant) {
        if (participant == null) return null;
        return ParticipantInfoDTO.builder()
                .participantId(participant.getParticipantId())
                .nickname(participant.getNickname())
                .isAnonymous(participant.isAnonymous())
                .score(participant.getScore())
                .correctCount(participant.getCorrectCount())
                .status(participant.getStatus())
                .build();
    }

    // ==================== Participant → DTO ====================

    @Mapping(target = "gameId", source = "game.gameId")
    GameParticipantDTO toParticipantDTO(GameParticipant participant);

    // ==================== QUESTION → DTO (GAME MODULE) ====================

    /**
     * ✅ Map Question to DTO WITHOUT revealing correct answers
     * Used for: Sending questions to players during game
     *
     * ✅ CRITICAL: Only include options WITHOUT correct field
     * ✅ Use QuestionType enum (not String)
     * ✅ Parse JSON fields (tagsJson, answerVariationsJson)
     */
    default com.kkunquizapp.QuizAppBackend.game.dto.QuestionResponseDTO toQuestionDTOWithoutAnswers(Question question) {
        if (question == null) return null;

        return com.kkunquizapp.QuizAppBackend.game.dto.QuestionResponseDTO.builder()
                .questionId(question.getQuestionId())
                .quizId(question.getQuiz() != null ? question.getQuiz().getQuizId() : null)
                .questionText(question.getQuestionText())
                .type(question.getType())  // ✅ ENUM
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .imageUrl(question.getImageUrl())
                .explanation(question.getExplanation())
                .hint(question.getHint())
                .difficulty(question.getDifficulty())
                .shuffleOptions(question.isShuffleOptions())
                .caseInsensitive(question.isCaseInsensitive())
                .partialCredit(question.isPartialCredit())
                .allowMultipleCorrect(question.isAllowMultipleCorrect())
                // ✅ Parse JSON fields
                .tags(parseJsonArray(question.getTagsJson()))
                .answerVariations(parseJsonArray(question.getAnswerVariationsJson()))
                .deleted(question.isDeleted())
                .deletedAt(question.getDeletedAt())
                .deletedBy(question.getDeletedBy())
                .createdBy(question.getCreatedBy())
                .updatedBy(question.getUpdatedBy())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .version(question.getVersion())
                .totalAttempts(question.getTotalAttempts())
                .correctAttempts(question.getCorrectAttempts())
                .passRate(question.getPassRate())
                .averageTimeSeconds(question.getAverageTimeSeconds())
                .difficultyIndex(question.getDifficultyIndex())
                .discriminationIndex(question.getDiscriminationIndex())
                .hasLatex(question.isHasLatex())
                .hasCode(question.isHasCode())
                .hasTable(question.isHasTable())
                .hasVideo(question.isHasVideo())
                .hasAudio(question.isHasAudio())
                .options(mapOptionsClean(question.getOptions(), false))  // ✅ NO correct flag
                .build();
    }

    /**
     * ✅ Map Question to DTO WITH correct answers revealed
     * Used for: Showing results after question ends
     *
     * ✅ CRITICAL: Include options WITH correct field
     * ✅ Use QuestionType enum (not String)
     * ✅ Parse JSON fields (tagsJson, answerVariationsJson)
     */
    default com.kkunquizapp.QuizAppBackend.game.dto.QuestionResponseDTO toQuestionDTO(Question question) {
        if (question == null) return null;

        return com.kkunquizapp.QuizAppBackend.game.dto.QuestionResponseDTO.builder()
                .questionId(question.getQuestionId())
                .quizId(question.getQuiz() != null ? question.getQuiz().getQuizId() : null)
                .questionText(question.getQuestionText())
                .type(question.getType())  // ✅ ENUM
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .imageUrl(question.getImageUrl())
                .explanation(question.getExplanation())
                .hint(question.getHint())
                .difficulty(question.getDifficulty())
                .shuffleOptions(question.isShuffleOptions())
                .caseInsensitive(question.isCaseInsensitive())
                .partialCredit(question.isPartialCredit())
                .allowMultipleCorrect(question.isAllowMultipleCorrect())
                // ✅ Parse JSON fields
                .tags(parseJsonArray(question.getTagsJson()))
                .answerVariations(parseJsonArray(question.getAnswerVariationsJson()))
                .deleted(question.isDeleted())
                .deletedAt(question.getDeletedAt())
                .deletedBy(question.getDeletedBy())
                .createdBy(question.getCreatedBy())
                .updatedBy(question.getUpdatedBy())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .version(question.getVersion())
                .totalAttempts(question.getTotalAttempts())
                .correctAttempts(question.getCorrectAttempts())
                .passRate(question.getPassRate())
                .averageTimeSeconds(question.getAverageTimeSeconds())
                .difficultyIndex(question.getDifficultyIndex())
                .discriminationIndex(question.getDiscriminationIndex())
                .hasLatex(question.isHasLatex())
                .hasCode(question.isHasCode())
                .hasTable(question.isHasTable())
                .hasVideo(question.isHasVideo())
                .hasAudio(question.isHasAudio())
                .options(mapOptionsClean(question.getOptions(), true))  // ✅ WITH correct flag
                .build();
    }

    /**
     * ✅ Parse JSON array string to List<String>
     *
     * Handles:
     * - null input → empty list
     * - "[]" → empty list
     * - '["tag1", "tag2"]' → List("tag1", "tag2")
     */
    default List<String> parseJsonArray(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty() || jsonString.equals("[]")) {
            return List.of();
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(jsonString, mapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * ✅ Clean mapping: Only relevant fields per option type
     *
     * @param options List of Option entities from database
     * @param includeCorrect Whether to include the "correct" field
     * @return List of clean OptionDTOs with only relevant fields
     */
    default List<OptionDTO> mapOptionsClean(List<Option> options, boolean includeCorrect) {
        if (options == null || options.isEmpty()) {
            return List.of();
        }

        return options.stream()
                .map(option -> toOptionDTOClean(option, includeCorrect))
                .collect(Collectors.toList());
    }

    /**
     * ✅ CORE LOGIC: Convert Option to DTO with only relevant fields
     *
     * Uses pattern matching to map only fields specific to each option type,
     * avoiding null fields in JSON response.
     */
    default OptionDTO toOptionDTOClean(Option option, boolean includeCorrect) {
        if (option == null) return null;

        // Base builder with common fields
        var baseBuilder = OptionDTO.builder()
                .optionId(option.getOptionId())
                .orderIndex(option.getOrderIndex())
                .explanation(option.getExplanation());

        // Add correct flag if needed
        if (includeCorrect) {
            baseBuilder.correct(option.isCorrect());
        }

        // Map only type-specific fields
        return switch (option) {
            // Single/Multiple Choice
            case SingleChoiceOption sco -> baseBuilder
                    .type("SINGLE_CHOICE")
                    .text(sco.getText())
                    .imageUrl(sco.getImageUrl())
                    .build();

            case MultipleChoiceOption mco -> baseBuilder
                    .type("MULTIPLE_CHOICE")
                    .text(mco.getText())
                    .imageUrl(mco.getImageUrl())
                    .build();

            // True/False
            case TrueFalseOption tfo -> baseBuilder
                    .type("TRUE_FALSE")
                    .text(tfo.getText())
                    .build();

            // Image Selection
            case ImageSelectionOption iso -> baseBuilder
                    .type("IMAGE_SELECTION")
                    .imageUrl(iso.getImageUrl())
                    .imageLabel(iso.getImageLabel())
                    .thumbnailUrl(iso.getThumbnailUrl())
                    .build();

            // Fill in the Blank
            case FillInTheBlankOption fbo -> baseBuilder
                    .type("FILL_IN_THE_BLANK")
                    .correctAnswer(fbo.getCorrectAnswer())
                    .caseInsensitive(fbo.isCaseInsensitive())
                    .build();

            // Matching
            case MatchingOption mo -> baseBuilder
                    .type("MATCHING")
                    .leftItem(mo.getLeftItem())
                    .rightItem(mo.getRightItem())
                    .build();

            // Ordering
            case OrderingOption oo -> baseBuilder
                    .type("ORDERING")
                    .item(oo.getItem())
                    .correctPosition(oo.getCorrectPosition())
                    .build();

            // Drag & Drop
            case DragDropOption ddo -> baseBuilder
                    .type("DRAG_DROP")
                    .draggableItem(ddo.getDraggableItem())
                    .dropZoneId(ddo.getDropZoneId())
                    .dropZoneLabel(ddo.getDropZoneLabel())
                    .dragImageUrl(ddo.getDragImageUrl())
                    .build();

            // Hotspot
            case HotspotOption ho -> baseBuilder
                    .type("HOTSPOT")
                    .imageUrl(ho.getImageUrl_hotspot())
                    .hotspotCoordinates(ho.getHotspotCoordinates())
                    .hotspotLabel(ho.getHotspotLabel())
                    .build();

            // Short Answer
            case ShortAnswerOption sao -> baseBuilder
                    .type("SHORT_ANSWER")
                    .expectedAnswer(sao.getExpectedAnswer())
                    .caseInsensitive(sao.isCaseInsensitive())
                    .build();

            // Essay
            case EssayOption eo -> baseBuilder
                    .type("ESSAY")
                    .minWords(eo.getMinWords())
                    .maxWords(eo.getMaxWords())
                    .sampleAnswer(eo.getSampleAnswer())
                    .build();

            // Dropdown
            case DropdownOption dro -> baseBuilder
                    .type("DROPDOWN")
                    .dropdownValue(dro.getDropdownValue())
                    .displayLabel(dro.getDisplayLabel())
                    .placeholder(dro.getPlaceholder())
                    .build();

            // Matrix
            case MatrixOption mo -> baseBuilder
                    .type("MATRIX")
                    .rowId(mo.getRowId())
                    .columnId(mo.getColumnId())
                    .rowLabel(mo.getRowLabel())
                    .columnLabel(mo.getColumnLabel())
                    .cellValue(mo.getCellValue())
                    .build();

            // Ranking
            case RankingOption ro -> baseBuilder
                    .type("RANKING")
                    .rankableItem(ro.getRankableItem())
                    .correctRank(ro.getCorrectRank())
                    .rankingScale(ro.getRankingScale())
                    .build();

            // Fallback
            default -> baseBuilder
                    .type(option.getClass().getSimpleName())
                    .text(option.getText())
                    .build();
        };
    }

    // ==================== Leaderboard & Stats ====================

    default LeaderboardEntryDTO toLeaderboardEntry(GameParticipant p, int rank) {
        return LeaderboardEntryDTO.builder()
                .rank(rank)
                .participantId(p.getParticipantId())
                .nickname(p.getNickname())
                .score(p.getScore())
                .correctCount(p.getCorrectCount())
                .currentStreak(p.getCurrentStreak())
                .averageTimeMs(p.getAverageResponseTimeMs() == 0 ? null : (long) p.getAverageResponseTimeMs())
                .isAnonymous(p.isAnonymous())
                .build();
    }

    @Mapping(target = "quizId", source = "quiz.quizId")
    @Mapping(target = "quizTitle", source = "quiz.title")
    UserQuizStatsDTO toStatsDTO(UserQuizStatistics stats);
}