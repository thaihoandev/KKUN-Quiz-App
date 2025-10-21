package com.kkunquizapp.QuizAppBackend.article.service;

import com.kkunquizapp.QuizAppBackend.article.model.Tag;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TagService {
    Page<Tag> getAll(Pageable pageable);
    List<Tag> getOrCreateMany(List<String> names);
    Tag getOrCreate(String name);
}