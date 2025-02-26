package com.kkunquizapp.QuizAppBackend.repo;

import com.kkunquizapp.QuizAppBackend.model.MultipleChoiceOption;
import com.kkunquizapp.QuizAppBackend.model.Option;
import com.kkunquizapp.QuizAppBackend.model.Question;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OptionRepo extends JpaRepository<Option, UUID> {
    Optional<Option> findByQuestion(Question question);
    List<MultipleChoiceOption> findAllByQuestionAndCorrectTrue(Question question);
}
