package com.kkunquizapp.QuizAppBackend.question.repository;

import com.kkunquizapp.QuizAppBackend.question.model.Option;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OptionRepo extends JpaRepository<Option, UUID> {

    // Find options by question
    List<Option> findByQuestionQuestionIdOrderByOrderIndexAsc(UUID questionId);

    // Find correct options
    List<Option> findByQuestionQuestionIdAndCorrectTrue(UUID questionId);

    // Delete by question
    void deleteByQuestionQuestionId(UUID questionId);
}