package com.kkunquizapp.QuizAppBackend.model.enums;

public enum QuestionType {
    MULTIPLE_CHOICE("MULTIPLE_CHOICE"),
    SINGLE_CHOICE("SINGLE_CHOICE"),
    TRUE_FALSE("TRUE_FALSE"),
    FILL_IN_THE_BLANK("FILL_IN_THE_BLANK");
    private final String value;

    QuestionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    // Constants
    public static final String SINGLE_CHOICE_TYPE = "SINGLE_CHOICE";
    public static final String MULTIPLE_CHOICE_TYPE = "MULTIPLE_CHOICE";
    public static final String TRUE_FALSE_TYPE = "TRUE_FALSE";
    public static final String FILL_IN_THE_BLANK_TYPE = "FILL_IN_THE_BLANK";
}
