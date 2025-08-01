package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Question;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepo extends JpaRepository<Question, UUID> {
    List<Question> findAllByQuiz(Quiz quiz);

    @Query("SELECT q FROM Question q WHERE q.quiz = :quiz AND q.deleted = false")
    List<Question> findActiveQuestionsByQuiz(@Param("quiz") Quiz quiz);
}
