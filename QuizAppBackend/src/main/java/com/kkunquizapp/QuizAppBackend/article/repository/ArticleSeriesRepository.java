package com.kkunquizapp.QuizAppBackend.article.repository;

import com.kkunquizapp.QuizAppBackend.article.model.ArticleSeries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArticleSeriesRepository extends JpaRepository<ArticleSeries, UUID> {

    // 🔹 Lấy danh sách liên kết bài viết trong series theo thứ tự
    List<ArticleSeries> findBySeriesIdOrderByOrderIndex(UUID seriesId);

    // 🔹 Tìm một liên kết cụ thể giữa series và article
    Optional<ArticleSeries> findBySeriesIdAndArticleId(UUID seriesId, UUID articleId);

    // 🔹 Kiểm tra xem bài viết đã nằm trong series chưa
    boolean existsBySeriesIdAndArticleId(UUID seriesId, UUID articleId);

    Optional<ArticleSeries> findByArticleId(UUID articleId);

    // 🔹 Xóa tất cả liên kết thuộc một series (khi xóa series)
    void deleteBySeriesId(UUID seriesId);
}
