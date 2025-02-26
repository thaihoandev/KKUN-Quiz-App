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
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class QuizServiceImpl implements QuizService {

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private UserRepo userRepo;

    private final ModelMapper modelMapper;

    public QuizServiceImpl(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }
    public QuizResponseDTO getQuizById(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        return modelMapper.map(existingQuiz, QuizResponseDTO.class);
    }

    public QuizResponseDTO createQuiz(HttpServletRequest request, QuizRequestDTO quizRequestDTO){
        // Lấy hostId từ request attribute
        String hostId = (String) request.getAttribute("currentUserId");

        if (hostId == null) {
            throw new IllegalStateException("Host ID not found in request");
        }

        // Tạo quiz mới
        Quiz quiz = modelMapper.map(quizRequestDTO, Quiz.class);
        quiz.setHost(userRepo.findById(UUID.fromString(hostId))
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + hostId)));
        quiz.setStatus(QuizStatus.DRAFT);
        Quiz savedQuiz = quizRepo.save(quiz);

        return modelMapper.map(savedQuiz, QuizResponseDTO.class);

    }

    public QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO quizRequestDTO) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        ObjectMapper objectMapper = new ObjectMapper();

        // Chỉ map các trường không null từ QuizRequestDTO vào existingQuiz
        try {
            // Chỉ map các trường không null từ QuizRequestDTO vào existingQuiz
            objectMapper.updateValue(existingQuiz, quizRequestDTO);
        } catch (JsonMappingException e) {
            throw new RuntimeException("Failed to update quiz: " + e.getMessage(), e);
        }

        Quiz updatedQuiz = quizRepo.save(existingQuiz);

        return modelMapper.map(updatedQuiz, QuizResponseDTO.class);
    }

    public QuizResponseDTO deleteQuiz(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        existingQuiz.setStatus(QuizStatus.CLOSED);
        Quiz deletedQuiz = quizRepo.save(existingQuiz);

        return modelMapper.map(deletedQuiz, QuizResponseDTO.class);
    }

    public void addViewerByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        // Xóa user khỏi danh sách editors nếu có
        quiz.getEditors().remove(user);

        // Thêm hoặc xóa user khỏi danh sách viewers
        if (!quiz.getViewers().contains(user)) {
            quiz.getViewers().add(user);
        }

        quizRepo.save(quiz);
    }

    public void addEditorByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        // Thêm hoặc xóa user khỏi danh sách editors
        if (!quiz.getEditors().contains(user)) {
            quiz.getEditors().add(user);
        }

        quizRepo.save(quiz);
    }


}
