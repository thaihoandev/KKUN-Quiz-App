package com.kkunquizapp.QuizAppBackend.game.dto;

import com.kkunquizapp.QuizAppBackend.player.dto.PlayerResponseDTO;
import lombok.Data;

import java.util.List;

@Data
public class GameDetailsResponseDTO {
    private GameResponseDTO game;
    private List<PlayerResponseDTO> players;
    private String title;
}