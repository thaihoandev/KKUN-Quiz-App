package com.kkunquizapp.QuizAppBackend.article.model;

import com.kkunquizapp.QuizAppBackend.article.model.enums.ArticleDifficulty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "articles")
@Getter
@Setter
public class Article {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(columnDefinition = "TEXT")
    private String contentHtml;

    private String thumbnailUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ArticleCategory articleCategory;

    @Enumerated(EnumType.STRING)
    private ArticleDifficulty difficulty;

    @Column(columnDefinition = "UUID")
    private UUID authorId;

    private boolean published = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "article_tags",
            joinColumns = @JoinColumn(name = "article_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @Column(nullable = false)
    private int readingTime = 0; // minutes

    @Column(nullable = false)
    private long views = 0;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
