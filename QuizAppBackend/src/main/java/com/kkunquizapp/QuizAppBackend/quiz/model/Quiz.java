package com.kkunquizapp.QuizAppBackend.quiz.model;


import com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name = "quiz")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(updatable = false, nullable = false, unique = true)
    private UUID quizId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING) // Lưu giá trị enum dưới dạng chuỗi
    @Column(nullable = false, length = 20)
    private QuizStatus status; // "PUBLISHED", "ACHIEVED", "CLOSED", "DRAFT"

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "quiz_viewers",
            joinColumns = @JoinColumn(name = "quiz_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> viewers = new ArrayList<>();; // Danh sách người dùng được phép xem

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "quiz_editors",
            joinColumns = @JoinColumn(name = "quiz_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> editors = new ArrayList<>();; // Danh sách người dùng được phép chỉnh sửa
    @Column(nullable = false)
    private double recommendationScore = 0.0;
}
