package com.kkunquizapp.QuizAppBackend.quiz.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "quiz_categories")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QuizCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name;

    private String slug;
    private String icon;
    private int orderIndex;
}
