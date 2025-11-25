package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.repository.ArticleRepository;
import com.kkunquizapp.QuizAppBackend.article.service.ViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ViewServiceImpl implements ViewService {
    private final ArticleRepository articleRepository;


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void increaseViews(UUID id) {
        articleRepository.incrementViews(id);
    }
}
