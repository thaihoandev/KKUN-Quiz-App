package com.kkunquizapp.QuizAppBackend.game.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class ParticipantNotFoundException extends GameException {
    public ParticipantNotFoundException(UUID participantId) {
        super("Participant not found: " + participantId, "PARTICIPANT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}
