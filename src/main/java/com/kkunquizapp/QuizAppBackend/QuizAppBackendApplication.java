package com.kkunquizapp.QuizAppBackend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.Connection;
import java.sql.DriverManager;

@SpringBootApplication
public class QuizAppBackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure()
				.directory("src/main/resources")
				.filename("local.env")
				.load();
		// Nạp các biến từ dotenv vào System properties
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(QuizAppBackendApplication.class, args);

	}

}
