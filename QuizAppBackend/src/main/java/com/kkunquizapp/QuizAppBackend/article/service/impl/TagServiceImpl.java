package com.kkunquizapp.QuizAppBackend.article.service.impl;

import com.kkunquizapp.QuizAppBackend.article.model.Tag;
import com.kkunquizapp.QuizAppBackend.article.repository.TagRepository;
import com.kkunquizapp.QuizAppBackend.article.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    @Override
    public Page<Tag> getAll(Pageable pageable) {
        return tagRepository.findAll(pageable);
    }

    @Override
    public Tag getOrCreate(String name) {
        return tagRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> tagRepository.save(newTag(name)));
    }

    @Override
    public List<Tag> getOrCreateMany(List<String> names) {
        return names.stream()
                .map(this::getOrCreate)
                .collect(Collectors.toList());
    }

    private Tag newTag(String name) {
        Tag tag = new Tag();
        tag.setName(name.trim());
        return tag;
    }
}
