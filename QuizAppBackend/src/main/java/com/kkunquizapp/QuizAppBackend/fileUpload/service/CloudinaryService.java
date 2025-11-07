package com.kkunquizapp.QuizAppBackend.fileUpload.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

public interface CloudinaryService {

    /**
     * Upload file lên Cloudinary.
     * @param file file cần upload
     * @param path có thể là folder ("articles/thumbnails") hoặc public_id ("user_avatars/<uuid>")
     * @return map chứa thông tin upload (secure_url, public_id, v.v.)
     */
    Map upload(MultipartFile file, String path) throws IOException;

    /**
     * Upload file với public_id cụ thể (ghi đè ảnh cũ).
     */
    Map uploadWithPublicId(MultipartFile file, String publicId) throws IOException;

    /**
     * Xóa file theo public_id.
     */
    Map destroy(String publicId) throws IOException;
}
