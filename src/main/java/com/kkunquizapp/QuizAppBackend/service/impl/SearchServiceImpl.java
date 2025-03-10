package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.QuizResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.Quiz;
import com.kkunquizapp.QuizAppBackend.model.enums.QuizStatus;
import com.kkunquizapp.QuizAppBackend.repo.QuizRepo;
import com.kkunquizapp.QuizAppBackend.service.SearchService;
import com.kkunquizapp.QuizAppBackend.utils.StringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchServiceImpl implements SearchService {
    @Autowired
    private QuizRepo quizRepository;
    private final ModelMapper modelMapper;

    public SearchServiceImpl(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }
    // Tìm kiếm quiz theo title (không phân biệt chữ hoa/thường)
    public List<QuizResponseDTO> searchQuizzesByTitle(String title) {
        String titleNoAccent = StringUtils.removeAccents(title);
        List<Quiz> quizzes = quizRepository.findAll(); // Lấy toàn bộ quiz

        return quizzes.stream()
                .filter(q -> q.getStatus() == QuizStatus.PUBLISHED) // Chỉ lấy quiz có status PUBLISHED
                .filter(q -> StringUtils.removeAccents(q.getTitle()).toLowerCase()
                        .contains(titleNoAccent.toLowerCase())) // Tìm kiếm không dấu
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    // Chuyển đổi Quiz entity sang QuizResponseDTO
    private QuizResponseDTO convertToDTO(Quiz quiz) {
        return modelMapper.map(quiz, QuizResponseDTO.class);
    }
}
