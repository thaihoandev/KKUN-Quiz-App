package com.kkunquizapp.QuizAppBackend.question.model.enums;

/**
 * Question Type Enum
 * Định nghĩa tất cả loại câu hỏi được hỗ trợ
 */
public enum QuestionType {

    /**
     * Chọn một hoặc nhiều đáp án đúng
     * Ví dụ: "Chọn tất cả các đáp án đúng"
     */
    MULTIPLE_CHOICE("Multiple Choice", "Chọn một hoặc nhiều đáp án"),

    /**
     * Chỉ chọn một đáp án đúng
     * Ví dụ: "Thủ đô của Việt Nam là?"
     */
    SINGLE_CHOICE("Single Choice", "Chọn một đáp án"),

    /**
     * Câu hỏi Đúng/Sai
     * Ví dụ: "Trái Đất quay quanh Mặt Trời"
     */
    TRUE_FALSE("True/False", "Đúng hoặc Sai"),

    /**
     * Điền từ/cụm từ còn thiếu
     * Ví dụ: "Thủ đô của Pháp là ___"
     */
    FILL_IN_THE_BLANK("Fill in the Blank", "Điền từ còn thiếu"),

    /**
     * Ghép cặp/Matching questions
     * Ví dụ: Ghép quốc gia với thủ đô
     */
    MATCHING("Matching", "Ghép cặp"),

    /**
     * Sắp xếp lại thứ tự
     * Ví dụ: Sắp xếp các bước theo thứ tự đúng
     */
    ORDERING("Ordering", "Sắp xếp thứ tự"),

    /**
     * Kéo thả (Drag and Drop)
     * Ví dụ: Kéo danh từ vào cột đúng
     */
    DRAG_DROP("Drag & Drop", "Kéo thả"),

    /**
     * Trả lời ngắn (Short Answer)
     * Ví dụ: "Giải thích tại sao..."
     */
    SHORT_ANSWER("Short Answer", "Trả lời ngắn"),

    /**
     * Tự luận (Essay)
     * Ví dụ: "Viết bài luận về..."
     */
    ESSAY("Essay", "Tự luận"),

    /**
     * Click vào vùng đúng trên ảnh (Hotspot)
     * Ví dụ: Click vào thủ đô trên bản đồ
     */
    HOTSPOT("Hotspot", "Click vào vùng trên ảnh"),

    /**
     * Chọn ảnh đúng
     * Ví dụ: Chọn ảnh của Paris
     */
    IMAGE_SELECTION("Image Selection", "Chọn ảnh đúng"),

    /**
     * Chọn từ dropdown
     * Ví dụ: Dropdown menu lựa chọn
     */
    DROPDOWN("Dropdown", "Chọn từ dropdown"),

    /**
     * Ma trận/Grid questions
     * Ví dụ: Bảng chọn (hàng x cột)
     */
    MATRIX("Matrix", "Câu hỏi dạng bảng"),

    /**
     * Xếp hạng/Ranking
     * Ví dụ: Xếp hạng các mục từ 1-5
     */
    RANKING("Ranking", "Xếp hạng");

    // ==================== FIELDS ====================
    private final String displayName;
    private final String description;

    // ==================== CONSTRUCTOR ====================
    QuestionType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    // ==================== GETTERS ====================
    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Kiểm tra xem câu hỏi có cho phép nhiều đáp án đúng không
     */
    public boolean allowsMultipleCorrectAnswers() {
        return switch (this) {
            case MULTIPLE_CHOICE, MATCHING, ORDERING, MATRIX, RANKING -> true;
            default -> false;
        };
    }

    /**
     * Kiểm tra xem câu hỏi có sử dụng ảnh không
     */
    public boolean usesImage() {
        return switch (this) {
            case HOTSPOT, IMAGE_SELECTION, DRAG_DROP -> true;
            default -> false;
        };
    }

    /**
     * Kiểm tra xem câu hỏi có cần chấm điểm thủ công không
     */
    public boolean requiresManualGrading() {
        return switch (this) {
            case ESSAY, SHORT_ANSWER -> true;
            default -> false;
        };
    }

    /**
     * Kiểm tra xem câu hỏi có thể chấm điểm tự động không
     */
    public boolean supportsAutoGrading() {
        return switch (this) {
            case ESSAY -> false; // Essay cần chấm thủ công
            default -> true;
        };
    }

    /**
     * Lấy số lượng tùy chọn tối thiểu
     */
    public int getMinimumOptions() {
        return switch (this) {
            case TRUE_FALSE -> 2;
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> 2;
            case MATCHING, ORDERING -> 2;
            case FILL_IN_THE_BLANK, SHORT_ANSWER, ESSAY, HOTSPOT -> 1;
            default -> 1;
        };
    }

    /**
     * Lấy số lượng tùy chọn tối đa
     */
    public int getMaximumOptions() {
        return switch (this) {
            case TRUE_FALSE -> 2;
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> 10;
            case MATCHING, ORDERING -> 20;
            case MATRIX -> 50; // hàng x cột
            case RANKING -> 20;
            default -> Integer.MAX_VALUE;
        };
    }

    /**
     * Kiểm tra xem loại câu hỏi có hợp lệ không
     */
    public static boolean isValid(String value) {
        try {
            QuestionType.valueOf(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Lấy QuestionType từ string
     */
    public static QuestionType fromString(String value) {
        try {
            return QuestionType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid question type: " + value);
        }
    }

    /**
     * Lấy tất cả loại câu hỏi cần chấm thủ công
     */
    public static QuestionType[] getManualGradingTypes() {
        return new QuestionType[]{ESSAY, SHORT_ANSWER};
    }

    /**
     * Lấy tất cả loại câu hỏi tự động chấm
     */
    public static QuestionType[] getAutoGradingTypes() {
        return new QuestionType[]{
                MULTIPLE_CHOICE, SINGLE_CHOICE, TRUE_FALSE,
                FILL_IN_THE_BLANK, MATCHING, ORDERING, DRAG_DROP,
                HOTSPOT, IMAGE_SELECTION, DROPDOWN, MATRIX, RANKING
        };
    }
}