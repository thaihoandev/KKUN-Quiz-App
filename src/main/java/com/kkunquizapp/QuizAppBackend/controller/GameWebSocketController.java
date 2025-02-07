package com.kkunquizapp.QuizAppBackend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller

public class GameWebSocketController {
    @MessageMapping("/join")
    @SendTo("/topic/game")
    public String joinGame(String player) {
        return player + " has joined the game!";
    }

    @MessageMapping("/play")
    @SendTo("/topic/quiz")
    public String playQuiz(String answer) {
        return "Player answered: " + answer;
    }
}
