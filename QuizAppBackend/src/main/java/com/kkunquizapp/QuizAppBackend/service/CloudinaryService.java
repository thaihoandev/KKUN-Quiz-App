package com.kkunquizapp.QuizAppBackend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface CloudinaryService {
    Map upload(MultipartFile file, String folder)throws IOException;
    Map uploadWithPublicId(MultipartFile file, String publicId) throws IOException;
    Map destroy(String publicId) throws IOException;

}
