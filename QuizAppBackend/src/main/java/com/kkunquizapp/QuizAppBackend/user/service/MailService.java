package com.kkunquizapp.QuizAppBackend.user.service;

public interface MailService {
    void sendEmail(String to, String subject, String htmlContent);
}
