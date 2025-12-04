package com.kkunquizapp.QuizAppBackend.game.repository;

import com.kkunquizapp.QuizAppBackend.game.model.Game;
import com.kkunquizapp.QuizAppBackend.game.model.GameParticipant;
import com.kkunquizapp.QuizAppBackend.game.model.UserAnswer;
import com.kkunquizapp.QuizAppBackend.question.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAnswerRepo extends JpaRepository<UserAnswer, java.util.UUID> {

    boolean existsByGameAndParticipantAndQuestion(Game game, GameParticipant participant, Question question);

    int countByGame(Game game);

    int countByGameAndCorrectTrue(Game game);

    // Thống kê chi tiết theo participant
    List<UserAnswer> findByParticipant(GameParticipant participant);

    // Lấy tất cả answer của một question trong game (dùng cho analytics)
    @Query("SELECT a FROM UserAnswer a WHERE a.game = :game AND a.question = :question")
    List<UserAnswer> findByGameAndQuestion(@Param("game") Game game, @Param("question") Question question);
}