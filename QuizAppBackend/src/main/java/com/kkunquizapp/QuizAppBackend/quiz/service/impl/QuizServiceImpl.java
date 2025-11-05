package com.kkunquizapp.QuizAppBackend.quiz.service.impl;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.question.model.*;
import com.kkunquizapp.QuizAppBackend.question.repository.OptionRepo;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.quiz.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.quiz.model.*;
import com.kkunquizapp.QuizAppBackend.quiz.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.quiz.repository.QuizRepo;
import com.kkunquizapp.QuizAppBackend.quiz.service.QuizService;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepo quizRepo;
    private final UserRepo userRepo;
    private final QuestionRepo questionRepo;
    private final OptionRepo optionRepo;
    private final ModelMapper modelMapper;

    // ==================== Lấy tất cả quiz ====================
    @Override
    public Page<QuizResponseDTO> getAllQuizzes(Pageable pageable) {
        Page<Quiz> quizzes = quizRepo.findAll(pageable);
        return quizzes.map(q -> modelMapper.map(q, QuizResponseDTO.class));
    }

    // ==================== Lấy quiz theo user ====================
    @Override
    public Page<QuizResponseDTO> getQuizzesByUser(UUID userId, Pageable pageable, QuizStatus status) {
        Page<Quiz> quizzes = (status == null)
                ? quizRepo.findByHost_UserId(userId, pageable)
                : quizRepo.findByHost_UserIdAndStatus(userId, status, pageable);

        return quizzes.map(q -> modelMapper.map(q, QuizResponseDTO.class));
    }

    // ==================== Lấy quiz theo ID ====================
    @Override
    public QuizResponseDTO getQuizById(UUID quizId) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));
        return modelMapper.map(quiz, QuizResponseDTO.class);
    }

    @Override
    public Page<QuizResponseDTO> getPublishedQuizzes(Pageable pageable) {
        Page<Quiz> publishedQuizzes = quizRepo.findByStatus(QuizStatus.PUBLISHED, pageable);

        return publishedQuizzes.map(quiz -> {
            double score = calculateRecommendationScore(quiz, quiz.getHost() != null ? quiz.getHost().getUserId() : null);
            QuizResponseDTO dto = modelMapper.map(quiz, QuizResponseDTO.class);
            dto.setRecommendationScore(score);
            return dto;
        });
    }
    // ==================== Tạo quiz ====================
    @Override
    public QuizResponseDTO createQuiz(UserPrincipal currentUser, QuizRequestDTO dto) {
        UUID hostId = currentUser.getUserId();
        User host = userRepo.findById(hostId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + hostId));

        Quiz quiz = modelMapper.map(dto, Quiz.class);
        quiz.setHost(host);
        quiz.setStatus(QuizStatus.DRAFT);
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, hostId));

        Quiz saved = quizRepo.save(quiz);
        return modelMapper.map(saved, QuizResponseDTO.class);
    }

    // ==================== Cập nhật quiz ====================
    @Override
    public QuizResponseDTO updateQuiz(UUID quizId, QuizRequestDTO dto) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        ObjectMapper mapper = new ObjectMapper();
        try {
            mapper.updateValue(quiz, dto);
        } catch (JsonMappingException e) {
            throw new RuntimeException("Failed to update quiz: " + e.getMessage());
        }

        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        Quiz updated = quizRepo.save(quiz);
        return modelMapper.map(updated, QuizResponseDTO.class);
    }

    // ==================== Đăng quiz ====================
    @Override
    public QuizResponseDTO publishedQuiz(UUID quizId) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setUpdatedAt(LocalDateTime.now());
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        quizRepo.save(quiz);

        return modelMapper.map(quiz, QuizResponseDTO.class);
    }

    // ==================== Xóa quiz ====================
    @Override
    public QuizResponseDTO deleteQuiz(UUID quizId) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        quiz.setStatus(QuizStatus.CLOSED);
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        quizRepo.save(quiz);

        return modelMapper.map(quiz, QuizResponseDTO.class);
    }

    // ==================== Thêm viewer ====================
    @Override
    public void addViewerByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        quiz.getEditors().remove(user);
        if (!quiz.getViewers().contains(user)) quiz.getViewers().add(user);
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        quizRepo.save(quiz);
    }

    // ==================== Thêm editor ====================
    @Override
    public void addEditorByEmail(UUID quizId, String email) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (!quiz.getEditors().contains(user)) quiz.getEditors().add(user);
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        quizRepo.save(quiz);
    }

    // ==================== Lưu quiz cho user hiện tại ====================
    @Override
    @Transactional
    public QuizResponseDTO saveForCurrentUser(UserPrincipal currentUser, UUID quizId) {
        UUID currentUserId = currentUser.getUserId();
        User user = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + currentUserId));

        Quiz original = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found: " + quizId));

        Quiz copy = new Quiz();
        copy.setTitle(original.getTitle());
        copy.setDescription(original.getDescription());
        copy.setHost(user);
        copy.setStatus(QuizStatus.DRAFT);
        copy.setCreatedAt(LocalDateTime.now());
        copy.setUpdatedAt(LocalDateTime.now());
        copy.setViewers(new ArrayList<>());
        copy.setEditors(new ArrayList<>());
        copy.setRecommendationScore(calculateRecommendationScore(copy, currentUserId));
        quizRepo.save(copy);

        // clone câu hỏi
        var originalQuestions = questionRepo.findActiveQuestionsByQuiz(original);
        for (Question q : originalQuestions) {
            Question clone = new Question();
            clone.setQuiz(copy);
            clone.setQuestionText(q.getQuestionText());
            clone.setQuestionType(q.getQuestionType());
            clone.setImageUrl(q.getImageUrl());
            clone.setTimeLimit(q.getTimeLimit());
            clone.setPoints(q.getPoints());
            clone.setCreatedAt(LocalDateTime.now());
            clone.setDeleted(false);
            questionRepo.save(clone);

            for (Option opt : q.getOptions()) {
                optionRepo.save(cloneOption(opt, clone));
            }
        }

        QuizResponseDTO dto = modelMapper.map(copy, QuizResponseDTO.class);
        dto.setRecommendationScore(calculateRecommendationScore(copy, currentUserId));
        return dto;
    }

    // ==================== Helper methods ====================
    private double calculateRecommendationScore(Quiz quiz, UUID currentUserId) {
        double score = 0.0;
        LocalDateTime now = LocalDateTime.now();
        long daysSinceUpdate = Duration.between(quiz.getUpdatedAt(), now).toDays();
        score += Math.max(0, 100 - daysSinceUpdate);

        int viewerCount = quiz.getViewers() != null ? quiz.getViewers().size() : 0;
        int editorCount = quiz.getEditors() != null ? quiz.getEditors().size() : 0;
        score += (viewerCount + editorCount) * 5;

        if (currentUserId != null) {
            boolean isRelated = quiz.getViewers().stream().anyMatch(u -> u.getUserId().equals(currentUserId))
                    || quiz.getEditors().stream().anyMatch(u -> u.getUserId().equals(currentUserId));
            if (isRelated) score += 50;
        }
        return score;
    }

    private Option cloneOption(Option source, Question owner) {
        if (source instanceof MultipleChoiceOption m) {
            MultipleChoiceOption o = new MultipleChoiceOption();
            o.setQuestion(owner);
            o.setOptionText(m.getOptionText());
            o.setCorrect(m.isCorrect());
            return o;
        } else if (source instanceof SingleChoiceOption s) {
            SingleChoiceOption o = new SingleChoiceOption();
            o.setQuestion(owner);
            o.setOptionText(s.getOptionText());
            o.setCorrect(s.isCorrect());
            return o;
        } else if (source instanceof TrueFalseOption t) {
            TrueFalseOption o = new TrueFalseOption();
            o.setQuestion(owner);
            o.setOptionText(t.getOptionText());
            o.setCorrect(t.isCorrect());
            return o;
        } else if (source instanceof FillInTheBlankOption f) {
            FillInTheBlankOption o = new FillInTheBlankOption();
            o.setQuestion(owner);
            o.setOptionText(f.getOptionText());
            o.setCorrectAnswer(f.getCorrectAnswer());
            o.setCorrect(true);
            return o;
        }
        throw new IllegalArgumentException("Unsupported option type: " + source.getClass().getSimpleName());
    }
}
