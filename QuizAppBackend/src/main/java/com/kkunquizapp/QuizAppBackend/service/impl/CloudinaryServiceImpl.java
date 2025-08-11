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
    public Map upload(MultipartFile file, String publicId) throws IOException {
        Map options = ObjectUtils.asMap(
                "public_id", publicId,        // ví dụ: "user_avatars/<uuid>"
                "overwrite", true,            // ghi đè
                "invalidate", true,           // bắt CDN xóa cache
                "unique_filename", false,
                "resource_type", "image"
        );
        return cloudinary.uploader().upload(file.getBytes(), options);
    }

    public Map destroy(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("invalidate", true, "resource_type", "image"));
    }
}
