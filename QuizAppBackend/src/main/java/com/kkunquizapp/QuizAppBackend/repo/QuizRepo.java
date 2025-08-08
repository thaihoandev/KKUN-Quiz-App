package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepo extends JpaRepository<Quiz, UUID> {
    Page<Quiz> findByHost_UserId(UUID userId, Pageable pageable);
    Page<Quiz> findByHost_UserIdAndStatus(UUID userId, QuizStatus status, Pageable pageable);

    Page<Quiz> findByStatus(QuizStatus status, Pageable pageable);
}