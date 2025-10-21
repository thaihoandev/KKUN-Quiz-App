package com.kkunquizapp.QuizAppBackend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PageResponse<T> {
    private List<T> content;
    private int page;           // trang hiện tại (0-based)
    private int size;           // kích thước trang
    private long totalElements; // tổng số bản ghi
    private int totalPages;     // tổng số trang
    private boolean hasNext;
    private boolean hasPrev;
}
