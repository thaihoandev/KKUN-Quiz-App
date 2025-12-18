package com.kkunquizapp.QuizAppBackend.game.service;

import com.kkunquizapp.QuizAppBackend.question.model.Question;
import com.kkunquizapp.QuizAppBackend.question.repository.QuestionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * GameScheduler - Wrapper service để đảm bảo @Transactional hoạt động đúng
 *
 * Vấn đề: TaskScheduler.schedule() chạy trong thread khác → transaction context mất
 * Giải pháp: Tạo wrapper method với @Transactional để mở transaction mới
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GameScheduler {

    private final GameService gameService;
    private final QuestionRepo questionRepo;

    /**
     * Thực sự bắt đầu game (sau 3 giây countdown)
     * Đảm bảo transaction được mở
     */
    @Transactional(rollbackFor = Exception.class)
    public void actuallyStartGameTx(UUID gameId, UUID hostId) {
        log.info("GameScheduler: actuallyStartGame called for game {}", gameId);
        try {
//            gameService.actuallyStartGame(gameId, hostId);
        } catch (Exception e) {
            log.error("GameScheduler: Failed to start game {}: {}", gameId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Kết thúc câu hỏi hiện tại (sau time limit)
     * Đảm bảo transaction được mở để load question + broadcast
     */
    @Transactional(rollbackFor = Exception.class)
    public void endQuestionTx(UUID gameId) {
        log.info("GameScheduler: endQuestion called for game {}", gameId);
        try {
            gameService.endQuestion(gameId);
        } catch (Exception e) {
            log.error("GameScheduler: Failed to end question for game {}: {}", gameId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Chuyển sang câu hỏi tiếp theo (sau 8 giây hiển thị đáp án)
     * Đảm bảo transaction được mở để load + broadcast question
     */
    @Transactional(rollbackFor = Exception.class)
    public void moveToNextQuestionTx(UUID gameId, UUID hostId) {
        log.info("GameScheduler: moveToNextQuestion called for game {}", gameId);
        try {
            gameService.moveToNextQuestion(gameId, hostId);
        } catch (Exception e) {
            log.error("GameScheduler: Failed to move to next question for game {}: {}", gameId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Broadcast câu hỏi hiện tại (đã được lấy từ DB)
     * Được gọi từ moveToNextQuestion() → transaction vẫn mở
     * (Không cần gọi trực tiếp từ scheduler)
     */
    @Transactional(rollbackFor = Exception.class)
    public void broadcastQuestionTx(UUID gameId, UUID questionId) {
        log.info("GameScheduler: broadcastQuestion called for game {}, question {}", gameId, questionId);
        try {
            Question question = questionRepo.findByIdWithOptions(questionId)
                    .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
            gameService.broadcastQuestionFromGameSession(gameId, question);
        } catch (Exception e) {
            log.error("GameScheduler: Failed to broadcast question {} for game {}: {}",
                    questionId, gameId, e.getMessage(), e);
            throw e;
        }
    }
}