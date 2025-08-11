package com.kkunquizapp.QuizAppBackend.service;

public interface MailService {
    void sendEmail(String to, String subject, String htmlContent);
}
