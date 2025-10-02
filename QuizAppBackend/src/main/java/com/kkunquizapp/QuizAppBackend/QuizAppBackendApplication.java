package com.kkunquizapp.QuizAppBackend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class QuizAppBackendApplication {

	public static void main(String[] args) {
		// ✅ Chỉ load dotenv khi không chạy trên Render
		if (System.getenv("RENDER") == null) {
			try {
				Dotenv dotenv = Dotenv.configure()
						.directory("src/main/resources")
						.filename("local.env")
						.ignoreIfMissing()
						.load();
				// Nạp các biến từ dotenv vào System properties
				dotenv.entries().forEach(entry ->
						System.setProperty(entry.getKey(), entry.getValue()));
			} catch (Exception ignored) {
				System.out.println("⚠️ Không tìm thấy local.env, bỏ qua...");
			}
		}

		SpringApplication.run(QuizAppBackendApplication.class, args);
	}
}
