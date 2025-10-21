package com.kkunquizapp.QuizAppBackend.question.repository;

import com.kkunquizapp.QuizAppBackend.question.model.MultipleChoiceOption;
import com.kkunquizapp.QuizAppBackend.question.model.Option;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
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
