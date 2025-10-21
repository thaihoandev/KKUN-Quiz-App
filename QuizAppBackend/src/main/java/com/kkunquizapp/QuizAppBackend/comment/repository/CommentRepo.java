package com.kkunquizapp.QuizAppBackend.comment.repository;

import com.kkunquizapp.QuizAppBackend.comment.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepo extends JpaRepository<Comment, UUID> {
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId")
    List<Comment> findByPostPostId(@Param("postId") UUID postId);

    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId AND c.parentComment IS NULL AND c.deletedAt IS NULL")
    List<Comment> findByPostPostIdAndParentCommentCommentIdIsNullAndDeletedAtIsNull(@Param("postId") UUID postId);

    @Query("SELECT c FROM Comment c WHERE c.commentId = :commentId AND c.deletedAt IS NULL")
    Optional<Comment> findByIdAndDeletedAtIsNull(@Param("commentId") UUID commentId);
}