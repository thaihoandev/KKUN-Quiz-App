package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionResponseDTO;
import com.kkunquizapp.QuizAppBackend.service.GameService;
import com.kkunquizapp.QuizAppBackend.service.LeaderboardService;
import com.kkunquizapp.QuizAppBackend.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/players")
public class PlayerController {
    @Autowired
    private GameService gameService;
    @Autowired
    private QuestionService questionService;
    @Autowired
    private LeaderboardService leaderboardService;


}
