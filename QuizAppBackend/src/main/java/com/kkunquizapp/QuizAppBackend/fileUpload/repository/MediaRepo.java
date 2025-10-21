package com.kkunquizapp.QuizAppBackend.fileUpload.repository;

import com.kkunquizapp.QuizAppBackend.fileUpload.model.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MediaRepo extends JpaRepository<Media, UUID> {
}