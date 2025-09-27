package com.kkunquizapp.QuizAppBackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicGenerateRequest {

    /**
     * Chủ đề người dùng nhập (VD: "Java OOP", "HTTP", "Địa lý Việt Nam").
     * Có thể rỗng, nhưng nên giới hạn độ dài để tránh prompt quá dài.
     */
    @Size(max = 300, message = "Topic tối đa 300 ký tự")
    private String topic;

    /**
     * Số câu muốn sinh. Mặc định 5. Service sẽ clamp theo cấu hình (vd. <= limits.max-questions).
     */
    @Min(value = 1, message = "Số câu tối thiểu là 1")
    @Max(value = 10, message = "Số câu tối đa là 10")
    @Builder.Default
    private Integer count = 5;

    /**
     * Loại câu hỏi mong muốn: TRUE_FALSE | SINGLE_CHOICE | MULTIPLE_CHOICE | AUTO.
     * Nếu null/blank → coi như AUTO để AI tự chọn hợp lý (service đã xử lý).
     */
    private String questionType; // "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "AUTO"

    /**
     * Thời gian giới hạn cho mỗi câu (giây). Mặc định 60 giây.
     */
    @Min(value = 5, message = "timeLimit tối thiểu là 5 giây")
    @Max(value = 300, message = "timeLimit tối đa là 300 giây")
    @Builder.Default
    private Integer timeLimit = 60;

    /**
     * Điểm cho mỗi câu. Mặc định 1000.
     */
    @Min(value = 1, message = "points tối thiểu là 1")
    @Max(value = 100000, message = "points tối đa là 100000")
    @Builder.Default
    private Integer points = 1000;

    /**
     * Ngôn ngữ đầu ra: "vi" hoặc "en". Mặc định "vi".
     */
    @Builder.Default
    private String language = "vi";

    /**
     * Chuẩn hóa: trim chuỗi, default khi null/blank, cắt topic quá dài phòng trường hợp bỏ qua validation.
     */
    public TopicGenerateRequest normalized() {
        TopicGenerateRequest out = new TopicGenerateRequest();
        out.topic = topic == null ? "" : topic.trim();
        if (out.topic.length() > 300) {
            out.topic = out.topic.substring(0, 300);
        }

        // Clamp tối đa 10
        out.count = (count == null || count < 1) ? 5 : Math.min(count, 10);

        out.questionType = (questionType == null || questionType.isBlank())
                ? "AUTO"
                : questionType.trim().toUpperCase();

        // Mặc định 60s, clamp 5..300
        out.timeLimit = (timeLimit == null || timeLimit < 5) ? 60 : Math.min(timeLimit, 300);

        out.points = (points == null || points < 1) ? 1000 : Math.min(points, 100000);

        out.language = (language == null || language.isBlank())
                ? "vi"
                : language.trim().toLowerCase();

        return out;
    }
}
