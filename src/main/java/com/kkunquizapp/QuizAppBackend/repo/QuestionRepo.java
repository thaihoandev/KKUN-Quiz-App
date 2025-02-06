package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.Question;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepo extends JpaRepository<Question, UUID> {
    List<Question> findAllByQuiz(Quiz quiz);
}
