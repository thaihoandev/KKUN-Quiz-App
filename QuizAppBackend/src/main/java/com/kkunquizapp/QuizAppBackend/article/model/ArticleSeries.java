package com.kkunquizapp.QuizAppBackend.article.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "article_series")
@Getter
@Setter
public class ArticleSeries {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(columnDefinition = "UUID")
    private UUID articleId;

    @Column(columnDefinition = "UUID")
    private UUID seriesId;

    @Column(nullable = false)
    private int orderIndex = 0;
}

