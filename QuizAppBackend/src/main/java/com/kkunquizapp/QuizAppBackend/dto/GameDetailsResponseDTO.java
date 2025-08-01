package com.kkunquizapp.QuizAppBackend.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class GameDetailsResponseDTO {
    private GameResponseDTO game;
    private List<PlayerResponseDTO> players;
    private String title;
}