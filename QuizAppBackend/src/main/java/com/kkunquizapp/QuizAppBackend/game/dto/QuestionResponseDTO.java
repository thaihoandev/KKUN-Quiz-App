package com.kkunquizapp.QuizAppBackend.game.dto;
import com.kkunquizapp.QuizAppBackend.question.model.enums.QuestionType;
import lombok.*;

import java.util.List;
import java.util.UUID;
// DTO câu hỏi gửi cho người chơi (không lộ đáp án đúng)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponseDTO {
    private UUID questionId;
    private String questionText;
    private QuestionType type;
    private List<OptionDTO> options; // text + id, không có isCorrect
    private int timeLimitSeconds;
    private int points;
    private String imageUrl;
    private String explanation; // chỉ hiện khi reveal
}
