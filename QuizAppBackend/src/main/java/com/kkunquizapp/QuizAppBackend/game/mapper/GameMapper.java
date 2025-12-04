// File: GameMapper.java (ĐÃ SỬA HOÀN CHỈNH)
package com.kkunquizapp.QuizAppBackend.game.mapper;

import com.kkunquizapp.QuizAppBackend.game.dto.*;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.game.model.*;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GameMapper {

    GameMapper INSTANCE = Mappers.getMapper(GameMapper.class);

    // ==================== Game → DTO ====================

    @Mapping(target = "quizTitle", source = "quiz.title")
    @Mapping(target = "quizThumbnail", source = "quiz.coverImageUrl")   // SỬA: coverImageUrl
    @Mapping(target = "hostNickname", source = "host.name")
    GameResponseDTO toResponseDTO(Game game);

    @Mapping(target = "quiz", source = "game")
    @Mapping(target = "host", source = "game.host")
    @Mapping(target = "currentParticipant", source = "participant")
    GameDetailDTO toDetailDTO(Game game, boolean isHost, GameParticipant participant);

    @Mapping(target = "quizId", source = "quiz.quizId")
    @Mapping(target = "title", source = "quiz.title")
    @Mapping(target = "description", source = "quiz.description")
    @Mapping(target = "thumbnailUrl", source = "quiz.coverImageUrl")    // SỬA: coverImageUrl
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

    // ==================== Question → DTO (Client-side - KHÔNG lộ đáp án) ====================
    @Mapping(target = "options", source = "options", qualifiedByName = "mapOptionsWithoutCorrect")
    @Mapping(target = "type", source = "type")
    QuestionResponseDTO toQuestionDTOWithoutAnswers(Question question);

    @Mapping(target = "options", source = "options")
    @Mapping(target = "type", source = "type")
    QuestionResponseDTO toQuestionDTO(Question question);

    // Mapping options mà KHÔNG có field correct
    @Named("mapOptionsWithoutCorrect")
    default List<OptionDTO> mapOptionsWithoutCorrect(List<Option> options) {
        if (options == null) return null;
        return options.stream()
                .map(this::toOptionDTOWithoutCorrect)
                .toList();
    }

    // Mapping chi tiết từng loại Option (chỉ lấy những field cần thiết)
    default OptionDTO toOptionDTOWithoutCorrect(Option option) {
        if (option == null) return null;

        OptionDTO.OptionDTOBuilder builder = OptionDTO.builder()
                .optionId(option.getOptionId())
                .text(option.getText())
                .imageUrl(option.getImageUrl())
                .orderIndex(option.getOrderIndex())
                .matchKey(option.getMatchKey())
                .explanation(option.getExplanation());

        return switch (option) {
            case MatchingOption m -> builder
                    .leftItem(m.getLeftItem())
                    .rightItem(m.getRightItem())
                    .build();

            case OrderingOption o -> builder
                    .item(o.getItem())
                    .correctPosition(o.getCorrectPosition())
                    .build();

            case DragDropOption d -> builder
                    .draggableItem(d.getDraggableItem())
                    .dropZoneId(d.getDropZoneId())
                    .dropZoneLabel(d.getDropZoneLabel())
                    .dragImageUrl(d.getDragImageUrl())
                    .build();

            case HotspotOption h -> builder
                    .imageUrl(h.getImageUrl())
                    .hotspotCoordinates(h.getHotspotCoordinates())
                    .hotspotLabel(h.getHotspotLabel())
                    .build();

            case ImageSelectionOption i -> builder
                    .imageUrl(i.getImageUrl())
                    .imageLabel(i.getImageLabel())
                    .thumbnailUrl(i.getThumbnailUrl())
                    .build();

            case FillInTheBlankOption f -> builder
                    .correctAnswer(f.getCorrectAnswer())
                    .caseInsensitive(f.isCaseInsensitive())
                    .build();

            case TrueFalseOption t -> builder
                    .text(t.getText())
                    .build();

            default -> builder.build();
        };
    }

    // Nếu cần gửi kèm đáp án đúng (sau khi reveal)
    default List<OptionDTO> mapOptionsWithAnswers(List<Option> options) {
        if (options == null) return null;
        return options.stream()
                .map(opt -> toOptionDTOWithoutCorrect(opt).toBuilder()
                        .correct(opt.isCorrect())
                        .build())
                .toList();
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
                .averageTimeMs(p.getAverageResponseTimeMs() == 0 ? null : p.getAverageResponseTimeMs())
                .isAnonymous(p.isAnonymous())
                .build();
    }

    @Mapping(target = "quizId", source = "quiz.quizId")
    @Mapping(target = "quizTitle", source = "quiz.title")
    UserQuizStatsDTO toStatsDTO(UserQuizStatistics stats);
}