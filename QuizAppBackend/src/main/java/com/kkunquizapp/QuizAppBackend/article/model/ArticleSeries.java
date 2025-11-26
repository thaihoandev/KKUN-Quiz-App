package com.kkunquizapp.QuizAppBackend.article.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "article_series")
public class ArticleSeries {

    @Id
    @GeneratedValue
    private UUID id;

    // GIỮ field id dưới dạng raw ID (để dễ dùng)
    @Column(name = "article_id", insertable = false, updatable = false)
    private UUID articleId;

    @Column(name = "series_id", insertable = false, updatable = false)
    private UUID seriesId;

    // Relation thực sự
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private Article article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id")
    private Series series;

    private int orderIndex;
}


