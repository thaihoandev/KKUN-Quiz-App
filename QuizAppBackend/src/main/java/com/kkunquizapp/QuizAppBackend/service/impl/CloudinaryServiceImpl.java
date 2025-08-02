package com.kkunquizapp.QuizAppBackend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kkunquizapp.QuizAppBackend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {
    private final Cloudinary cloudinary;

    /**
     * Upload file to Cloudinary under specified folder.
     */
    public Map upload(MultipartFile file, String folder) throws IOException {
        Map<String, Object> params = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "auto"
        );
        return cloudinary.uploader().upload(file.getBytes(), params);
    }

    /**
     * Destroy (delete) an uploaded asset by public_id.
     */
    public Map destroy(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
