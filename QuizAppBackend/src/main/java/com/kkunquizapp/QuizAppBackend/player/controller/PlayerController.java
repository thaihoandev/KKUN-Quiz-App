package com.kkunquizapp.QuizAppBackend.player.controller;

import com.kkunquizapp.QuizAppBackend.game.service.GameService;
import com.kkunquizapp.QuizAppBackend.player.service.LeaderboardService;
import com.kkunquizapp.QuizAppBackend.question.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/players")
public class PlayerController {
    @Autowired
    private GameService gameService;
    @Autowired
    private QuestionService questionService;
    @Autowired
    private LeaderboardService leaderboardService;


}
