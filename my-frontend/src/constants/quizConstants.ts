// Các tùy chọn thời gian giới hạn (giây)
export const TIME_LIMIT_OPTIONS = [5, 10, 20, 30, 60, 90, 120, 180];

// Các tùy chọn điểm số
export const POINTS_OPTIONS = [1, 2, 3, 4, 5, 10];

// Các loại câu hỏi (dùng const assertion để cố định giá trị)
export const QUESTION_TYPES = {
    SINGLE_CHOICE: "SINGLE_CHOICE",
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    FILL_IN_THE_BLANK: "FILL_IN_THE_BLANK",
} as const;

// Tạo Type từ các giá trị của QUESTION_TYPES
export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

// Định nghĩa labels cho loại câu hỏi (dùng Record để đảm bảo type safety)
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    [QUESTION_TYPES.SINGLE_CHOICE]: "Một lựa chọn (một đáp án)",
    [QUESTION_TYPES.MULTIPLE_CHOICE]: "Nhiều lựa chọn (nhiều đáp án)",
    [QUESTION_TYPES.TRUE_FALSE]: "Đúng/Sai",
    [QUESTION_TYPES.FILL_IN_THE_BLANK]: "Điền vào chỗ trống",
};

// Giá trị mặc định
export const DEFAULT_TIME_LIMIT = 30;
export const DEFAULT_POINTS = 3;
export const DEFAULT_QUESTION_TYPE = QUESTION_TYPES.MULTIPLE_CHOICE;
