package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.model.User;

public interface AuthService {
    User verifyAndRegisterGoogleUser(String idTokenString) throws Exception;
}
