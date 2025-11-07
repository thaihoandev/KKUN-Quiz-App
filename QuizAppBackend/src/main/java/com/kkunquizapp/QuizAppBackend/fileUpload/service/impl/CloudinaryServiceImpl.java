package com.kkunquizapp.QuizAppBackend.fileUpload.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload file lên Cloudinary.
     * - Nếu path chứa "/" và KHÔNG có đuôi file => xem là folder.
     * - Nếu path chứa "/" và KHÔNG muốn tạo thêm folder => xem là public_id.
     */
    @Override
    public Map upload(MultipartFile file, String path) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        boolean isFolder = !path.contains(".") && !path.endsWith("/") && !path.matches(".*/[a-zA-Z0-9_-]+\\.[a-zA-Z]+$");

        Map options = ObjectUtils.asMap(
                isFolder ? "folder" : "public_id", path,
                "use_filename", true,
                "unique_filename", isFolder, // folder => tạo tên unique, public_id => không
                "overwrite", true,
                "invalidate", true,
                "resource_type", "auto"
        );

        log.info("Uploading to Cloudinary → path: {}, asFolder: {}", path, isFolder);
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

        Object url = uploadResult.get("secure_url");
        if (url == null) {
            log.warn("⚠️ Cloudinary upload result missing secure_url: {}", uploadResult);
            throw new IOException("Failed to get secure_url from Cloudinary response");
        }

        log.info("✅ Uploaded to Cloudinary: {}", url);
        return uploadResult;
    }

    /**
     * Upload file với public_id cố định — luôn ghi đè ảnh cũ.
     */
    @Override
    public Map uploadWithPublicId(MultipartFile file, String publicId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        Map options = ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", true,
                "invalidate", true,
                "unique_filename", false,
                "resource_type", "auto"
        );

        log.info("Uploading to Cloudinary with fixed public_id: {}", publicId);
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

        Object url = uploadResult.get("secure_url");
        if (url == null) {
            throw new IOException("Failed to get secure_url from Cloudinary response");
        }

        log.info("✅ Uploaded (overwrite) to Cloudinary: {}", url);
        return uploadResult;
    }

    /**
     * Xóa file theo public_id.
     */
    @Override
    public Map destroy(String publicId) throws IOException {
        log.info("Deleting Cloudinary resource: {}", publicId);
        return cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                "invalidate", true,
                "resource_type", "image"
        ));
    }
}
