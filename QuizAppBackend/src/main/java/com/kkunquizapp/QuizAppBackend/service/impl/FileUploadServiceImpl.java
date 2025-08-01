package com.kkunquizapp.QuizAppBackend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kkunquizapp.QuizAppBackend.dto.OptionRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.QuestionRequestDTO;
import com.kkunquizapp.QuizAppBackend.model.enums.QuestionType;
import com.kkunquizapp.QuizAppBackend.service.FileUploadService;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.tika.config.TikaConfig;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.mime.MediaType;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FileUploadServiceImpl implements FileUploadService {

    private static final String PDF_MIME_TYPE = "application/pdf";
    private static final String IMAGE_MIME_PREFIX = "image/";
    private static final int MIN_TEXT_LENGTH_THRESHOLD = 50; // Ngưỡng để xác định nếu cần OCR

    @Autowired
    private Cloudinary cloudinary;

    @Override
    public Map<String, Object> processFile(MultipartFile file, UUID quizId) {
        try {
            byte[] fileBytes = file.getBytes();
            String mimeType = determineMimeType(fileBytes);
            String content;

            if (mimeType.equals(PDF_MIME_TYPE)) {
                content = processPdf(fileBytes);
            } else if (mimeType.startsWith(IMAGE_MIME_PREFIX)) {
                content = processImage(fileBytes);
            } else {
                // Các định dạng khác như .docx, .txt, vv sử dụng Tika
                content = extractTextWithTika(new ByteArrayInputStream(fileBytes));
            }

            // Chuyển đổi văn bản thành danh sách câu hỏi
            List<QuestionRequestDTO> questions = parseQuestions(content, quizId);

            // Trả về kết quả
            Map<String, Object> response = new HashMap<>();
            response.put("quizId", quizId);
            response.put("title", "Quiz Generated from " + file.getOriginalFilename());
            response.put("description", "Auto-generated quiz from uploaded file");
            response.put("questions", questions);
            response.put("rawText", content); // Thêm text gốc để debug

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error processing file: " + e.getMessage(), e);
        }
    }

    /**
     * Xác định MIME type của file
     */
    private String determineMimeType(byte[] fileBytes) {
        try {
            TikaConfig config = TikaConfig.getDefaultConfig();
            Metadata metadata = new Metadata();
            MediaType mediaType = config.getDetector().detect(
                    new ByteArrayInputStream(fileBytes), metadata);
            return mediaType.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot determine file type: " + e.getMessage());
        }
    }

    /**
     * Xử lý file PDF - kết hợp cả PDFBox và OCR
     */
    private String processPdf(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            // Thử lấy text bằng PDFBox trước
            PDFTextStripper stripper = new PDFTextStripper();
            String pdfText = stripper.getText(document);

            // Kiểm tra xem text có đủ dài không
            if (pdfText.trim().length() > MIN_TEXT_LENGTH_THRESHOLD) {
                // Phân tích bằng Tika để cải thiện định dạng
                String tikaText = extractTextWithTika(new ByteArrayInputStream(pdfBytes));

                // Nếu Tika trả về text có ý nghĩa, sử dụng nó
                if (tikaText.trim().length() > MIN_TEXT_LENGTH_THRESHOLD) {
                    return tikaText;
                }
                return pdfText;
            }

            // Nếu text quá ngắn, sử dụng OCR
            return extractTextWithOCR(document);
        } catch (Exception e) {
            throw new RuntimeException("Error processing PDF: " + e.getMessage());
        }
    }

    /**
     * Xử lý ảnh bằng OCR
     */
    private String processImage(byte[] imageBytes) {
        try {
            ITesseract tesseract = new Tesseract();
            tesseract.setDatapath("tessdata/");
            tesseract.setLanguage("eng+vie"); // Thiết lập ngôn ngữ

            // Tạo BufferedImage từ bytes
            BufferedImage image = javax.imageio.ImageIO.read(new ByteArrayInputStream(imageBytes));

            // Thực hiện OCR
            return tesseract.doOCR(image);
        } catch (Exception e) {
            throw new RuntimeException("Error processing image with OCR: " + e.getMessage());
        }
    }

    /**
     * Phương thức trích xuất văn bản bằng Tika
     */
    private String extractTextWithTika(InputStream inputStream) {
        try {
            TikaConfig config = TikaConfig.getDefaultConfig();
            AutoDetectParser parser = new AutoDetectParser(config);
            BodyContentHandler handler = new BodyContentHandler(-1); // Không giới hạn dung lượng
            Metadata metadata = new Metadata();
            ParseContext context = new ParseContext();

            parser.parse(inputStream, handler, metadata, context);
            return handler.toString();
        } catch (Exception e) {
            System.out.println("Tika extraction error: " + e.getMessage());
            return "";
        }
    }

    /**
     * Phương thức trích xuất văn bản từ PDF bằng OCR
     */
    private String extractTextWithOCR(PDDocument document) {
        try {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            ITesseract tesseract = new Tesseract();
            tesseract.setDatapath("tessdata/");
            tesseract.setLanguage("eng");

            // Tạo một thread pool để xử lý OCR song song
            int processors = Runtime.getRuntime().availableProcessors();
            ExecutorService executor = Executors.newFixedThreadPool(processors);
            List<Future<String>> futures = new ArrayList<>();

            // Tạo các task OCR cho từng trang
            for (int i = 0; i < document.getNumberOfPages(); i++) {
                final int pageNum = i;
                Callable<String> task = () -> {
                    try {
                        BufferedImage image = pdfRenderer.renderImageWithDPI(pageNum, 300);
                        return tesseract.doOCR(image);
                    } catch (Exception e) {
                        return "Error OCR on page " + pageNum + ": " + e.getMessage();
                    }
                };
                futures.add(executor.submit(task));
            }

            // Thu thập kết quả
            StringBuilder fullText = new StringBuilder();
            for (Future<String> future : futures) {
                try {
                    String pageText = future.get();
                    fullText.append(pageText).append("\n\n");
                } catch (Exception e) {
                    fullText.append("Error getting OCR result: ").append(e.getMessage()).append("\n");
                }
            }

            executor.shutdown();
            return fullText.toString();
        } catch (Exception e) {
            throw new RuntimeException("OCR processing error: " + e.getMessage());
        }
    }

    /**
     * Chuyển nội dung văn bản thành danh sách câu hỏi với xử lý cải tiến
     */
    private List<QuestionRequestDTO> parseQuestions(String content, UUID quizId) {
        List<QuestionRequestDTO> questions = new ArrayList<>();

        // Chuẩn hóa văn bản đầu vào
        content = normalizeText(content);

        // Regex nhận diện câu hỏi
        Pattern questionPattern = Pattern.compile(
                "(?m)^(?:Câu\\s*|question\\s*|Q\\.?\\s*)?(\\d+)\\s*[.)/:]\\s+(.*?)$",
                Pattern.CASE_INSENSITIVE);

        // Regex nhận diện đáp án
        Pattern optionPattern = Pattern.compile(
                "(?m)^\\s*([A-D])\\s*[.)/:]\\s+(.*?)$",
                Pattern.CASE_INSENSITIVE);

        // Regex tìm dấu hiệu đáp án đúng
        Pattern correctPattern = Pattern.compile(
                "\\*|\\(correct\\)|\\[correct\\]|\\{correct\\}|\\+|✓|✔|correct answer|đáp án đúng",
                Pattern.CASE_INSENSITIVE);

        // Tìm câu hỏi trong nội dung văn bản
        Matcher questionMatcher = questionPattern.matcher(content);
        while (questionMatcher.find()) {
            String questionNumber = questionMatcher.group(1);
            String questionText = questionMatcher.group(2).trim();

            // Tìm đoạn văn bản từ sau câu hỏi này đến câu hỏi tiếp theo
            int startPos = questionMatcher.end();
            int endPos = content.length();

            // Tìm câu hỏi tiếp theo để xác định phạm vi của đáp án
            Matcher nextQuestionMatcher = questionPattern.matcher(content);
            if (nextQuestionMatcher.find(startPos)) {
                endPos = nextQuestionMatcher.start();
            }

            // Lấy đoạn văn bản chứa các đáp án
            String optionsText = content.substring(startPos, endPos);

            // Nhận diện đáp án
            List<OptionRequestDTO> options = new ArrayList<>();
            Matcher optionMatcher = optionPattern.matcher(optionsText);

            while (optionMatcher.find()) {
                String optionLetter = optionMatcher.group(1);
                String optionText = optionMatcher.group(2).trim();

                Matcher correctMatcher = correctPattern.matcher(optionText);
                boolean isCorrect = correctMatcher.find();

                // Xóa các ký hiệu đánh dấu đáp án đúng
                optionText = correctMatcher.replaceAll("").trim();

                // Thêm vào danh sách nếu không rỗng
                if (!optionText.isEmpty()) {
                    OptionRequestDTO option = new OptionRequestDTO();
                    option.setOptionId(UUID.randomUUID());
                    option.setOptionText(optionText);
                    option.setCorrect(isCorrect);
                    options.add(option);
                }
            }

            // Nếu không có đáp án đúng nào được đánh dấu, mặc định chọn đáp án đầu tiên
            boolean hasCorrectAnswer = options.stream().anyMatch(OptionRequestDTO::isCorrect);
            if (!hasCorrectAnswer && !options.isEmpty()) {
                options.get(0).setCorrect(true);
            }

            // Chỉ thêm câu hỏi nếu có ít nhất 2 đáp án
            if (options.size() >= 2) {
                QuestionRequestDTO question = new QuestionRequestDTO();
                question.setQuizId(quizId);
                question.setQuestionText(questionText);
                question.setQuestionType(QuestionType.SINGLE_CHOICE_TYPE);
                question.setImageUrl(null);
                question.setTimeLimit(30);
                question.setPoints(10);
                question.setOptions(options);

                questions.add(question);
            }
        }

        return questions;
    }


    /**
     * Chuẩn hóa text đầu vào
     */
    private String normalizeText(String text) {
        // Xóa ký tự đặc biệt không cần thiết
        text = text.replaceAll("\\r", "\n");

        // Chuẩn hóa dòng trống
        text = text.replaceAll("\\n{3,}", "\n\n");

        // Chuyển các định dạng câu hỏi phổ biến về dạng chuẩn
        // Ví dụ: "Question 1:", "Q.1:", "Q1." thành "1."
        text = text.replaceAll("(?i)(?:question|Q\\.?)\\s*(\\d+)[.:]?\\s*", "$1. ");

        // Chuyển các định dạng đáp án phổ biến về dạng chuẩn
        // Ví dụ: "Answer A:", "Ans A)", "Option A." thành "A)"
        text = text.replaceAll("(?i)(?:answer|ans\\.?|option)\\s*([A-D])[.):]*\\s*", "$1) ");

        // Chuẩn hóa các dạng của dấu chấm và ngoặc đơn để nhất quán
        text = text.replaceAll("(?m)^\\s*(\\d+)\\s*[.)/]\\s*", "$1. ");
        text = text.replaceAll("(?m)^\\s*([A-D])\\s*[.)/]\\s*", "$1) ");

        // Chuyển dấu gạch chéo dùng làm dấu phân cách thành dạng chuẩn
        text = text.replaceAll("(?m)^\\s*(\\d+)\\s*/\\s*", "$1. ");
        text = text.replaceAll("(?m)^\\s*([A-D])\\s*/\\s*", "$1) ");

        // Thêm khoảng trắng sau định dạng để dễ nhận diện
        text = text.replaceAll("(\\d+)\\.([^\\s])", "$1. $2");
        text = text.replaceAll("([A-D])\\)([^\\s])", "$1) $2");

        return text;
    }
    private String extractOptionContent(String optionText) {
        // Loại bỏ các dấu hiệu đánh dấu đáp án đúng
        optionText = optionText.replaceAll("\\*|\\(correct\\)|\\[correct\\]|\\{correct\\}|\\+|✓|✔|correct answer|đáp án đúng", "").trim();

        // Loại bỏ các định dạng phụ không cần thiết
        optionText = optionText.replaceAll("^[A-D][.):] ", "").trim();

        return optionText;
    }

    @Override
    public String uploadImageToCloudinary(MultipartFile file) {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }
}