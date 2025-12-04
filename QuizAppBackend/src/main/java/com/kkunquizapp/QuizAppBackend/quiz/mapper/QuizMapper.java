package com.kkunquizapp.QuizAppBackend.quiz.mapper;

import com.kkunquizapp.QuizAppBackend.question.dto.OptionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.quiz.dto.*;
import com.kkunquizapp.QuizAppBackend.quiz.model.Quiz;
import com.kkunquizapp.QuizAppBackend.user.dto.UserSummaryDto;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface QuizMapper {

    QuizMapper INSTANCE = Mappers.getMapper(QuizMapper.class);

    // ===================== USER → DTO =====================
    @Named("userToSummary")
    default UserSummaryDto userToSummary(User user) {
        if (user == null) return null;
        return UserSummaryDto.builder()
                .userId(user.getUserId())
                .name(user.getName() != null ? user.getName() : user.getUsername())
                .username(user.getUsername())
                .avatar(user.getAvatar())
                .build();
    }

    // ===================== QUIZ → SUMMARY DTO =====================
    @Mapping(target = "creator", source = "creator", qualifiedByName = "userToSummary")
    QuizSummaryDto toSummaryDto(Quiz quiz);

    // ===================== QUIZ → DETAIL DTO (có questions) =====================
    @Mapping(target = "creator", source = "creator", qualifiedByName = "userToSummary")
    @Mapping(target = "questions", source = "questions", qualifiedByName = "mapQuestions")
    @Mapping(target = "isOwner", ignore = true)
    @Mapping(target = "canPlay", ignore = true)
    @Mapping(target = "published", source = "published")
    @Mapping(target = "accessPassword", ignore = true) // không trả ra ngoài
    QuizDetailResponse toDetailDto(Quiz quiz);

    // ===================== MAP QUESTIONS =====================
    @Named("mapQuestions")
    default List<QuestionResponseDTO> mapQuestions(List<Question> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }
        return questions.stream()
                .map(this::mapQuestion)
                .collect(Collectors.toList());
    }

    // ===================== MAP SINGLE QUESTION =====================
    default QuestionResponseDTO mapQuestion(Question question) {
        if (question == null) return null;

        List<OptionResponseDTO> options = question.getOptions() == null || question.getOptions().isEmpty()
                ? List.of()
                : question.getOptions().stream()
                .map(this::mapOption)
                .collect(Collectors.toList());

        return QuestionResponseDTO.builder()
                .questionId(question.getQuestionId())
                .quizId(question.getQuiz().getQuizId())
                .questionText(question.getQuestionText())
                .questionType(question.getType().toString())
                .imageUrl(question.getImageUrl())
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .explanation(question.getExplanation())
                .hint(question.getHint())
                .difficulty(question.getDifficulty())
                .tags(parseJsonList(question.getTagsJson()))
                .shuffleOptions(question.isShuffleOptions())
                .caseInsensitive(question.isCaseInsensitive())
                .partialCredit(question.isPartialCredit())
                .allowMultipleCorrect(question.isAllowMultipleCorrect())
                .answerVariations(parseJsonList(question.getAnswerVariationsJson()))
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
                .options(options)
                .build();
    }

    // ===================== MAP SINGLE OPTION =====================
    default OptionResponseDTO mapOption(Option option) {
        if (option == null) return null;

        OptionResponseDTO.OptionResponseDTOBuilder builder = OptionResponseDTO.builder()
                .optionId(option.getOptionId())
                .text(option.getText())
                .imageUrl(option.getImageUrl())
                .correct(option.isCorrect())
                .matchKey(option.getMatchKey())
                .orderIndex(option.getOrderIndex())
                .explanation(option.getExplanation());

        // Map specific fields based on option type
        if (option instanceof FillInTheBlankOption) {
            FillInTheBlankOption fbo = (FillInTheBlankOption) option;
            builder.correctAnswer(fbo.getCorrectAnswer())
                    .acceptedVariations(fbo.getAcceptedVariations())
                    .typoTolerance(fbo.getTypoTolerance());
        } else if (option instanceof MatchingOption) {
            MatchingOption mo = (MatchingOption) option;
            builder.leftItem(mo.getLeftItem())
                    .rightItem(mo.getRightItem())
                    .correctMatchKey(mo.getCorrectMatchKey());
        } else if (option instanceof OrderingOption) {
            OrderingOption oo = (OrderingOption) option;
            builder.item(oo.getItem())
                    .correctPosition(oo.getCorrectPosition());
        } else if (option instanceof DragDropOption) {
            DragDropOption ddo = (DragDropOption) option;
            builder.draggableItem(ddo.getDraggableItem())
                    .dropZoneId(ddo.getDropZoneId())
                    .dropZoneLabel(ddo.getDropZoneLabel())
                    .dragImageUrl(ddo.getDragImageUrl());
        } else if (option instanceof ShortAnswerOption) {
            ShortAnswerOption sao = (ShortAnswerOption) option;
            builder.expectedAnswer(sao.getExpectedAnswer())
                    .requiredKeywords(parseJsonListFromString(sao.getRequiredKeywords()))
                    .optionalKeywords(parseJsonListFromString(sao.getOptionalKeywords()))
                    .partialCreditPercentage(sao.getPartialCreditPercentage());
        } else if (option instanceof EssayOption) {
            EssayOption eo = (EssayOption) option;
            builder.minWords(eo.getMinWords())
                    .maxWords(eo.getMaxWords())
                    .sampleAnswer(eo.getSampleAnswer())
                    .enablePlagiarismCheck(eo.isEnablePlagiarismCheck());
        } else if (option instanceof HotspotOption) {
            HotspotOption ho = (HotspotOption) option;
            builder.hotspotLabel(ho.getHotspotLabel());
        } else if (option instanceof ImageSelectionOption) {
            ImageSelectionOption iso = (ImageSelectionOption) option;
            builder.imageLabel(iso.getImageLabel())
                    .thumbnailUrl(iso.getThumbnailUrl());
        } else if (option instanceof DropdownOption) {
            DropdownOption dro = (DropdownOption) option;
            builder.dropdownValue(dro.getDropdownValue())
                    .displayLabel(dro.getDisplayLabel())
                    .placeholder(dro.getPlaceholder());
        } else if (option instanceof MatrixOption) {
            MatrixOption mao = (MatrixOption) option;
            builder.rowId(mao.getRowId())
                    .columnId(mao.getColumnId())
                    .rowLabel(mao.getRowLabel())
                    .columnLabel(mao.getColumnLabel())
                    .cellValue(mao.getCellValue())
                    .isCorrectCell(mao.isCorrectCell());
        } else if (option instanceof RankingOption) {
            RankingOption ro = (RankingOption) option;
            builder.rankableItem(ro.getRankableItem())
                    .correctRank(ro.getCorrectRank())
                    .rankingScale(ro.getRankingScale())
                    .allowPartialCredit(ro.isAllowPartialCredit());
        }

        return builder.build();
    }

    // ===================== HELPER METHODS =====================
    default List<String> parseJsonList(String json) {
        if (json == null || json.equals("[]") || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            // Simple JSON array parsing
            String trimmed = json.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                trimmed = trimmed.substring(1, trimmed.length() - 1);
                if (trimmed.isBlank()) return new ArrayList<>();
                return Arrays.stream(trimmed.split(","))
                        .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    default List<String> parseJsonListFromString(String json) {
        return parseJsonList(json);
    }

    // ===================== DTO → ENTITY =====================
    @Mapping(target = "quizId", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "totalQuestions", ignore = true)
    @Mapping(target = "totalSessions", ignore = true)
    @Mapping(target = "totalLivePlays", ignore = true)
    @Mapping(target = "averageScore", ignore = true)
    @Mapping(target = "averageTimeSpent", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "startCount", ignore = true)
    @Mapping(target = "completionCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "questions", ignore = true) // questions sẽ được xử lý riêng
    @Mapping(target = "tagsJson", ignore = true)
    @Mapping(target = "allowedUserIdsJson", ignore = true)
    Quiz toEntity(QuizCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "quizId", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "totalQuestions", ignore = true)
    @Mapping(target = "totalSessions", ignore = true)
    @Mapping(target = "totalLivePlays", ignore = true)
    @Mapping(target = "averageScore", ignore = true)
    @Mapping(target = "averageTimeSpent", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "startCount", ignore = true)
    @Mapping(target = "completionCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "tagsJson", ignore = true)
    @Mapping(target = "allowedUserIdsJson", ignore = true)
    void updateEntity(@MappingTarget Quiz quiz, QuizUpdateRequest request);
}