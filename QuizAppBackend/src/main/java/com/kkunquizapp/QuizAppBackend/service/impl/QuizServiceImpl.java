package com.kkunquizapp.QuizAppBackend.service.impl;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.QuizRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.repo.OptionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuestionRepo;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.QuizService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepo quizRepo;
    private final UserRepo userRepo;

    private final QuestionRepo questionRepo;
    private final OptionRepo optionRepo;

    private final ModelMapper modelMapper;
    private final AuthService authService;

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
        quiz.setRecommendationScore(calculateRecommendationScore(quiz, UUID.fromString(hostId)));
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

        existingQuiz.setRecommendationScore(calculateRecommendationScore(existingQuiz, existingQuiz.getHost().getUserId()));
        Quiz updatedQuiz = quizRepo.save(existingQuiz);
        return modelMapper.map(updatedQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO publishedQuiz(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        existingQuiz.setStatus(QuizStatus.PUBLISHED);
        existingQuiz.setUpdatedAt(LocalDateTime.now());
        existingQuiz.setRecommendationScore(calculateRecommendationScore(existingQuiz, existingQuiz.getHost().getUserId()));
        Quiz updatedQuiz = quizRepo.save(existingQuiz);
        return modelMapper.map(updatedQuiz, QuizResponseDTO.class);
    }

    @Override
    public QuizResponseDTO deleteQuiz(UUID quizId) {
        Quiz existingQuiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        existingQuiz.setStatus(QuizStatus.CLOSED);
        existingQuiz.setRecommendationScore(calculateRecommendationScore(existingQuiz, existingQuiz.getHost().getUserId()));
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

        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
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

        quiz.setRecommendationScore(calculateRecommendationScore(quiz, quiz.getHost().getUserId()));
        quizRepo.save(quiz);
    }

    @Override
    public Page<QuizResponseDTO> getPublishedQuizzes(Pageable pageable) {
        // Lấy Optional<UUID> để xử lý null-safe
        Optional<UUID> currentUserId = getCurrentUserUuid();

        // Chỉ đọc, không save lại entity trên DB
        Page<Quiz> publishedQuizzes = quizRepo.findByStatus(QuizStatus.PUBLISHED, pageable);

        // Chuyển mỗi Quiz thành DTO và gắn recommendationScore ngay trên DTO
        return publishedQuizzes.map(quiz -> {
            double score = calculateRecommendationScore(quiz, currentUserId.orElse(null));
            QuizResponseDTO dto = modelMapper.map(quiz, QuizResponseDTO.class);
            dto.setRecommendationScore(score);
            return dto;
        });
    }

    private double calculateRecommendationScore(Quiz quiz, UUID currentUserId) {
        double score = 0.0;

        // 1. Recency
        LocalDateTime now = LocalDateTime.now();
        long daysSinceUpdate = Duration.between(quiz.getUpdatedAt(), now).toDays();
        score += Math.max(0, 100 - daysSinceUpdate);

        // 2. Popularity
        int viewerCount = quiz.getViewers()   != null ? quiz.getViewers().size()   : 0;
        int editorCount = quiz.getEditors()   != null ? quiz.getEditors().size()   : 0;
        score += (viewerCount + editorCount) * 5;

        // 3. User affinity (chỉ khi có currentUserId)
        if (currentUserId != null) {
            boolean isViewer = quiz.getViewers().stream()
                    .anyMatch(u -> u.getUserId().equals(currentUserId));
            boolean isEditor = quiz.getEditors().stream()
                    .anyMatch(u -> u.getUserId().equals(currentUserId));
            if (isViewer || isEditor) {
                score += 50;
            }
        }

        return score;
    }
    private Optional<UUID> getCurrentUserUuid() {
        try {
            String userIdStr = authService.getCurrentUserId();
            if (userIdStr != null && !userIdStr.isBlank()) {
                return Optional.of(UUID.fromString(userIdStr));
            }
        } catch (Exception ex) {
            // Nếu chưa auth hoặc token invalid, getCurrentUserId() có thể ném exception
            // Bỏ qua để trả về Optional.empty()
        }
        return Optional.empty();
    }


    @Override
    @Transactional
    public QuizResponseDTO saveForCurrentUser(HttpServletRequest request, UUID quizId) {
        // Lấy current user
        String currentUserIdStr = null;

        // Ưu tiên lấy từ AuthService (nếu đã dùng chung cho nơi khác)
        try {
            currentUserIdStr = authService.getCurrentUserId();
        } catch (Exception ignored) {}

        // Fallback: đọc từ request attribute (như createQuiz đang làm)
        if (currentUserIdStr == null) {
            Object attr = request.getAttribute("currentUserId");
            if (attr != null) currentUserIdStr = String.valueOf(attr);
        }

        if (currentUserIdStr == null || currentUserIdStr.isBlank()) {
            throw new IllegalStateException("User not authenticated");
        }

        UUID currentUserId = UUID.fromString(currentUserIdStr);
        User currentUser = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + currentUserId));

        // Lấy quiz gốc
        Quiz original = quizRepo.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with ID: " + quizId));

        // Tạo quiz bản sao
        Quiz copy = new Quiz();
        copy.setTitle(original.getTitle());                // hoặc original.getTitle() + " (Copy)"
        copy.setDescription(original.getDescription());
        copy.setHost(currentUser);
        copy.setStatus(QuizStatus.DRAFT);
        copy.setCreatedAt(java.time.LocalDateTime.now());
        copy.setUpdatedAt(java.time.LocalDateTime.now());
        copy.setViewers(new java.util.ArrayList<>()); // rỗng
        copy.setEditors(new java.util.ArrayList<>()); // rỗng
        copy.setRecommendationScore(calculateRecommendationScore(copy, currentUserId));

        copy = quizRepo.save(copy);

        // Lấy danh sách câu hỏi của quiz gốc (chỉ câu hỏi active)
        java.util.List<Question> originalQuestions = questionRepo.findActiveQuestionsByQuiz(original);

        // Clone từng câu hỏi + options
        for (Question q : originalQuestions) {
            Question qCopy = new Question();
            qCopy.setQuiz(copy);
            qCopy.setQuestionText(q.getQuestionText());
            qCopy.setQuestionType(q.getQuestionType());
            qCopy.setImageUrl(q.getImageUrl());
            qCopy.setTimeLimit(q.getTimeLimit());
            qCopy.setPoints(q.getPoints());
            qCopy.setCreatedAt(java.time.LocalDateTime.now());
            qCopy.setDeleted(false);

            qCopy = questionRepo.save(qCopy);

            // clone options theo kiểu lớp con
            for (Option opt : q.getOptions()) {
                Option newOpt = cloneOption(opt, qCopy);
                optionRepo.save(newOpt);
            }
        }

        // Map sang DTO để trả về (nếu muốn trả cả câu hỏi + options, nên refetch)
        Quiz fresh = quizRepo.findById(copy.getQuizId())
                .orElseThrow(() -> new IllegalStateException("Cloned quiz not found"));
        QuizResponseDTO dto = modelMapper.map(fresh, QuizResponseDTO.class);

        // Nếu cần tính lại score theo user hiện tại ngay trên DTO:
        dto.setRecommendationScore(calculateRecommendationScore(fresh, currentUserId));

        return dto;
    }

    /**
     * Clone 1 option theo đúng subclass.
     */
    private Option cloneOption(Option source, Question owner) {
        if (source instanceof MultipleChoiceOption m) {
            MultipleChoiceOption x = new MultipleChoiceOption();
            x.setQuestion(owner);
            x.setOptionText(m.getOptionText());
            x.setCorrect(m.isCorrect());
            return x;
        } else if (source instanceof SingleChoiceOption s) {
            SingleChoiceOption x = new SingleChoiceOption();
            x.setQuestion(owner);
            x.setOptionText(s.getOptionText());
            x.setCorrect(s.isCorrect());
            return x;
        } else if (source instanceof TrueFalseOption t) {
            TrueFalseOption x = new TrueFalseOption();
            x.setQuestion(owner);
            x.setOptionText(t.getOptionText());
            x.setCorrect(t.isCorrect());
            return x;
        } else if (source instanceof FillInTheBlankOption f) {
            FillInTheBlankOption x = new FillInTheBlankOption();
            x.setQuestion(owner);
            x.setOptionText(f.getOptionText());
            x.setCorrect(true);
            x.setCorrectAnswer(f.getCorrectAnswer()); // hoặc dùng optionText làm đáp án
            return x;
        } else {
            throw new IllegalArgumentException("Unsupported option type: " + source.getClass().getSimpleName());
        }
    }

}