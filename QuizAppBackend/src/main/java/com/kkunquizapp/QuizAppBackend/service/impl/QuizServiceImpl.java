package com.kkunquizapp.QuizAppBackend.service.impl;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.QuizService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepo quizRepo;
    private final UserRepo userRepo;
    private final ModelMapper modelMapper;

    @Override
    public Page<QuizResponseDTO> getAllQuizzes(Pageable pageable) {
        Page<Quiz> quizzes = quizRepo.findAll(pageable);
        return quizzes.map(quiz -> modelMapper.map(quiz, QuizResponseDTO.class));
    }

    @Override
    public Page<QuizResponseDTO> getQuizzesByUser(UUID userId, Pageable pageable, QuizStatus status) {
        Page<Quiz> quizzes;
        if (status == null) {
            quizzes = quizRepo.findByHost_UserId(userId, pageable);
        } else {
            quizzes = quizRepo.findByHost_UserIdAndStatus(userId, status, pageable);
        }
        return quizzes.map(quiz -> modelMapper.map(quiz, QuizResponseDTO.class));
    }

    @Override
    public QuizResponseDTO getQuizById(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));
        return modelMapper.map(existingQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO createQuiz(HttpServletRequest request, QuizRequestDTO quizRequestDTO) {
        String hostId = (String) request.getAttribute("currentUserId");
        if (hostId == null) {
            throw new IllegalStateException("Host ID not found in request");
        }

        Quiz quiz = modelMapper.map(quizRequestDTO, Quiz.class);
        quiz.setHost(userRepo.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + hostId)));
        quiz.setStatus(QuizStatus.DRAFT);
        Quiz savedQuiz = quizRepo.save(quiz);

        return modelMapper.map(savedQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO quizRequestDTO) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            objectMapper.updateValue(existingQuiz, quizRequestDTO);
        } catch (JsonMappingException e) {
            throw new RuntimeException("Failed to update quiz: " + e.getMessage(), e);
        }

        Quiz updatedQuiz = quizRepo.save(existingQuiz);
        return modelMapper.map(updatedQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO publishedQuiz(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        existingQuiz.setStatus(QuizStatus.PUBLISHED);
        existingQuiz.setUpdatedAt(LocalDateTime.now());

        Quiz updatedQuiz = quizRepo.save(existingQuiz);
        return modelMapper.map(updatedQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO deleteQuiz(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        existingQuiz.setStatus(QuizStatus.CLOSED);
        Quiz deletedQuiz = quizRepo.save(existingQuiz);
        return modelMapper.map(deletedQuiz, QuizResponseDTO.class);
    }

    @Override
    public void addViewerByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        quiz.getEditors().remove(user);
        if (!quiz.getViewers().contains(user)) {
            quiz.getViewers().add(user);
        }

        quizRepo.save(quiz);
    }

    @Override
    public void addEditorByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (!quiz.getEditors().contains(user)) {
            quiz.getEditors().add(user);
        }

        quizRepo.save(quiz);
    }
}
