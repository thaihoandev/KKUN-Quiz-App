package com.kkunquizapp.QuizAppBackend.fileUpload.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
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
                "public_id", publicId,
                "overwrite", false,          // KHÔNG ghi đè
                "invalidate", true,
                "unique_filename", false,    // ok vì ta đã tự unique trong publicId
                "resource_type", "auto"      // auto cho cả ảnh/video
        );
        return cloudinary.uploader().upload(file.getBytes(), options);
    }
    public Map uploadWithPublicId(MultipartFile file, String publicId) throws IOException {
        Map options = ObjectUtils.asMap(
                "public_id", publicId,     // ví dụ: posts/<postId>/<i>_<uuid>
                "overwrite", false,
                "unique_filename", false,  // ok vì publicId đã unique
                "invalidate", true,
                "resource_type", "auto"
        );
        return cloudinary.uploader().upload(file.getBytes(), options);
    }

    public Map destroy(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("invalidate", true, "resource_type", "image"));
    }
}
