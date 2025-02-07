package com.kkunquizapp.QuizAppBackend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class QuizWebSocketController {

    @MessageMapping("/quiz")  // Client gửi message tới /app/quiz
    @SendTo("/topic/quiz")    // Server gửi message tới /topic/quiz
    public String sendQuestion(String question) {
        return "New question: " + question;
    }
}
