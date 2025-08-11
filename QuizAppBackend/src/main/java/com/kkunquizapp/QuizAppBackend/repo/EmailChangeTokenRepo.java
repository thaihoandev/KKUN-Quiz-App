package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailChangeTokenRepo extends JpaRepository<EmailChangeToken, UUID> {
    Optional<EmailChangeToken> findByToken(String token);
    void deleteByUserId(UUID userId);
}
